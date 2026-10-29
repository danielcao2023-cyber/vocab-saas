package cn.xiaobei.vocabulary;

import org.junit.Test;
import java.util.*;
import static org.junit.Assert.*;

public class OfflineVoiceSelectorTest {
 private static final class Voice { final String name,locale; final boolean network,installed; Voice(String n,String l,boolean net,boolean ok){name=n;locale=l;network=net;installed=ok;} }
 private static final class Fake implements OfflineVoiceSelector.Engine<Voice> {
  List<Voice> voices=new ArrayList<>(); List<String> attempts=new ArrayList<>(); Set<String> rejected=new HashSet<>();
  public Collection<Voice> voices(){return voices;}
  public String language(Voice v){return v.locale.split("-")[0];}
  public String country(Voice v){String[] s=v.locale.split("-");return s.length>1?s[1]:"";}
  public boolean network(Voice v){return v.network;}
  public boolean installed(Voice v){return v.installed;}
  public boolean select(Voice v){attempts.add(v.name);return !rejected.contains(v.name);}
 }
 @Test public void prefersInstalledAmericanVoiceWithoutSelectingNetworkOrMissingData(){Fake f=new Fake();f.voices.add(new Voice("GB","en-GB",false,true));f.voices.add(new Voice("notInstalled","en-US",false,false));f.voices.add(new Voice("USnetwork","en-US",true,true));f.voices.add(new Voice("USlocal","en-US",false,true));assertTrue(OfflineVoiceSelector.choose(f));assertEquals(Arrays.asList("USlocal"),f.attempts);}
 @Test public void missingAmericanVoiceFallsBackToInstalledBritishVoice(){Fake f=new Fake();f.voices.add(new Voice("missing","en-US",false,false));f.voices.add(new Voice("GB","en-GB",false,true));assertTrue(OfflineVoiceSelector.choose(f));assertEquals(Arrays.asList("GB"),f.attempts);}
 @Test public void rejectedVoiceTriesNextAndNeverAcceptsNonEnglish(){Fake f=new Fake();f.voices.add(new Voice("US","en-US",false,true));f.voices.add(new Voice("FR","fr-FR",false,true));f.voices.add(new Voice("GB","en-GB",false,true));f.rejected.add("US");assertTrue(OfflineVoiceSelector.choose(f));assertEquals(Arrays.asList("US","GB"),f.attempts);}
 @Test public void absentInstalledEnglishReportsUnavailable(){Fake f=new Fake();f.voices.add(new Voice("USnetwork","en-US",true,true));f.voices.add(new Voice("GBmissing","en-GB",false,false));assertFalse(OfflineVoiceSelector.choose(f));assertTrue(f.attempts.isEmpty());}
}
