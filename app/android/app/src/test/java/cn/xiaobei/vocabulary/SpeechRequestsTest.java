package cn.xiaobei.vocabulary;
import org.junit.Test;
import static org.junit.Assert.*;
public class SpeechRequestsTest {
 @Test public void cancelledCallbackCannotCompleteNewRequest(){SpeechRequests<String> r=new SpeechRequests<>();r.begin("first");String a=r.start();assertEquals("first",r.cancel());r.begin("second");String b=r.start();assertNull(r.complete(a));assertEquals("second",r.current());assertEquals("second",r.complete(b));assertNull(r.current());}
 @Test public void stoppingBeforeEngineReadyPreventsLaterStart(){SpeechRequests<String> r=new SpeechRequests<>();r.begin("first");assertEquals("first",r.cancel());assertNull(r.start());assertNull(r.current());}
 @Test public void duplicateAndUnknownCompletionsAreIgnored(){SpeechRequests<String> r=new SpeechRequests<>();r.begin("one");String id=r.start();assertNull(r.complete("unknown"));assertEquals("one",r.complete(id));assertNull(r.complete(id));}
 @Test public void destroyedStateRejectsQueuedNewRequest(){SpeechRequests<String> r=new SpeechRequests<>();r.begin("one");assertEquals("one",r.close());assertFalse(r.begin("late"));assertNull(r.start());assertNull(r.current());}
}
