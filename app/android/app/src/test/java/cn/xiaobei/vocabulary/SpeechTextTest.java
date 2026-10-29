package cn.xiaobei.vocabulary;
import org.junit.Test;
import static org.junit.Assert.*;
public class SpeechTextTest {
 @Test public void acceptsWordsAndRejectsUnicodeWhitespace(){assertTrue(SpeechText.isBlank(""));assertTrue(SpeechText.isBlank(" \t\n\u2003"));assertFalse(SpeechText.isBlank(" senior high school "));}
}
