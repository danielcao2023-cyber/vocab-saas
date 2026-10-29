package cn.xiaobei.vocabulary;
/** Request identity protects against stale callbacks, including after shutdown. */
final class SpeechRequests<T> {
    private T current; private String utteranceId; private long sequence; private boolean closed;
    synchronized boolean begin(T value){if(closed)return false;current=value;utteranceId=null;return true;}
    synchronized T current(){return current;}
    synchronized String start(){if(closed||current==null)return null;return utteranceId="xiaobei-"+(++sequence);}
    synchronized T cancel(){T value=current;current=null;utteranceId=null;return value;}
    synchronized T close(){closed=true;return cancel();}
    synchronized T complete(String id){return id!=null&&id.equals(utteranceId)?cancel():null;}
}
