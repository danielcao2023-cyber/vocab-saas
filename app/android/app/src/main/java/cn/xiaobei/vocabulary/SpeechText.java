package cn.xiaobei.vocabulary;
/** Equivalent whitespace check without String.isBlank, which is unavailable on older Android. */
final class SpeechText {
    static boolean isBlank(String text){
        for(int i=0;i<text.length();){int cp=text.codePointAt(i);if(!Character.isWhitespace(cp))return false;i+=Character.charCount(cp);}
        return true;
    }
}
