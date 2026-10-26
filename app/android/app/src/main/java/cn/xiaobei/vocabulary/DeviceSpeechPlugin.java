package cn.xiaobei.vocabulary;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

/** Device English voice fallback for words without a bundled human recording. */
@CapacitorPlugin(name="DeviceSpeech")
public class DeviceSpeechPlugin extends Plugin {
    private TextToSpeech engine;
    private boolean ready=false,destroyed=false;
    private PluginCall pending;
    private String utteranceId;
    private long sequence=0;

    private void finish(String status) {
        PluginCall call=pending;pending=null;utteranceId=null;
        if(call!=null){JSObject result=new JSObject();result.put("status",status);call.resolve(result);}
    }
    private void start() {
        if(pending==null||!ready)return;
        int language=engine.setLanguage(Locale.US);
        if(language==TextToSpeech.LANG_MISSING_DATA||language==TextToSpeech.LANG_NOT_SUPPORTED){finish("unavailable");return;}
        // Network-only voices do not satisfy the offline learning contract.
        if(engine.getVoice()==null||engine.getVoice().isNetworkConnectionRequired()){
            android.speech.tts.Voice local=null;
            if(engine.getVoices()!=null)for(android.speech.tts.Voice voice:engine.getVoices()){
                if("en".equals(voice.getLocale().getLanguage())&&!voice.isNetworkConnectionRequired()){local=voice;break;}
            }
            if(local==null){finish("unavailable");return;}
            engine.setVoice(local);
        }
        engine.setSpeechRate(pending.getFloat("rate",1f));
        utteranceId="xiaobei-"+(++sequence);
        if(engine.speak(pending.getString("text"),TextToSpeech.QUEUE_FLUSH,null,utteranceId)==TextToSpeech.ERROR)finish("unavailable");
    }
    @PluginMethod public void speak(PluginCall call) {
        String text=call.getString("text","");
        if(text.isBlank()||text.length()>200){call.reject("Invalid word");return;}
        getActivity().runOnUiThread(()->{
            if(engine!=null)engine.stop();finish("cancelled");pending=call;
            if(engine!=null){start();return;}
            engine=new TextToSpeech(getContext(),status->getActivity().runOnUiThread(()->{
                if(destroyed)return;
                ready=status==TextToSpeech.SUCCESS;
                if(!ready){engine.shutdown();engine=null;finish("unavailable");return;}
                engine.setOnUtteranceProgressListener(new UtteranceProgressListener(){
                    @Override public void onStart(String id){}
                    @Override public void onDone(String id){complete(id,"success");}
                    @Override public void onError(String id){complete(id,"unavailable");}
                    @Override public void onStop(String id,boolean interrupted){complete(id,"cancelled");}
                });
                start();
            }));
        });
    }
    private void complete(String id,String status){getActivity().runOnUiThread(()->{if(id.equals(utteranceId))finish(status);});}
    @PluginMethod public void stop(PluginCall call){getActivity().runOnUiThread(()->{if(engine!=null)engine.stop();finish("cancelled");call.resolve();});}
    @Override protected void handleOnDestroy(){destroyed=true;if(engine!=null){engine.stop();engine.shutdown();}finish("cancelled");super.handleOnDestroy();}
}
