package cn.xiaobei.vocabulary;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/** Select only an installed local English voice, preferring US, and check engine acceptance. */
final class OfflineVoiceSelector {
    interface Engine<T> {
        Collection<T> voices();
        String language(T voice);
        String country(T voice);
        boolean network(T voice);
        boolean installed(T voice);
        boolean select(T voice);
    }
    static <T> boolean choose(Engine<T> engine) {
        Collection<T> voices=engine.voices();
        if(voices==null)return false;
        List<T> preferred=new ArrayList<>(), fallback=new ArrayList<>();
        for(T v:voices){
            if(v==null||!"en".equalsIgnoreCase(engine.language(v))||engine.network(v)||!engine.installed(v))continue;
            ("US".equalsIgnoreCase(engine.country(v))?preferred:fallback).add(v);
        }
        for(T v:preferred)if(engine.select(v))return true;
        for(T v:fallback)if(engine.select(v))return true;
        return false;
    }
}
