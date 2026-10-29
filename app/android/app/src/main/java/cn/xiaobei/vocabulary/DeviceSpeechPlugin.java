package cn.xiaobei.vocabulary;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Collection;
import android.speech.tts.Voice;

/** Device English voice fallback for words without a bundled human recording. */
@CapacitorPlugin(name="DeviceSpeech")
public class DeviceSpeechPlugin extends Plugin {
    private TextToSpeech engine;
    private boolean ready=false;
    private volatile boolean destroyed=false;
    private final SpeechRequests<PluginCall> requests=new SpeechRequests<>();

    private void resolve(PluginCall call,String status) {
        if(call!=null){JSObject result=new JSObject();result.put("status",status);call.resolve(result);}
    }
    private void finish(String status) { resolve(requests.cancel(),status); }
    private void start() {
        PluginCall pending=requests.current();
        if(pending==null||!ready)return;
        boolean selected=OfflineVoiceSelector.choose(new OfflineVoiceSelector.Engine<Voice>() {
            public Collection<Voice> voices(){return engine.getVoices();}
            public String language(Voice voice){return voice.getLocale().getLanguage();}
            public String country(Voice voice){return voice.getLocale().getCountry();}
            public boolean network(Voice voice){return voice.isNetworkConnectionRequired();}
            public boolean installed(Voice voice){return voice.getFeatures()==null||!voice.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED);}
            public boolean select(Voice voice){return engine.setVoice(voice)==TextToSpeech.SUCCESS;}
        });
        if(!selected){finish("unavailable");return;}
        engine.setSpeechRate(pending.getFloat("rate",1f));
        String utteranceId=requests.start();
        if(engine.speak(pending.getString("text"),TextToSpeech.QUEUE_FLUSH,null,utteranceId)==TextToSpeech.ERROR)finish("unavailable");
    }
    @PluginMethod public void speak(PluginCall call) {
        String text=call.getString("text","");
        if(SpeechText.isBlank(text)||text.length()>200){call.reject("Invalid word");return;}
        getActivity().runOnUiThread(()->{
            if(destroyed){resolve(call,"cancelled");return;}
            if(engine!=null)engine.stop();finish("cancelled");
            if(!requests.begin(call)){resolve(call,"cancelled");return;}
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
    private void complete(String id,String status){getActivity().runOnUiThread(()->{
        PluginCall call=requests.complete(id);
        if(call!=null){JSObject result=new JSObject();result.put("status",status);call.resolve(result);}
    });}
    @PluginMethod public void stop(PluginCall call){getActivity().runOnUiThread(()->{if(engine!=null)engine.stop();finish("cancelled");call.resolve();});}
    @Override protected void handleOnDestroy(){destroyed=true;PluginCall call=requests.close();if(engine!=null){engine.stop();engine.shutdown();}resolve(call,"cancelled");super.handleOnDestroy();}
}
