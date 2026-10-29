#!/usr/bin/env python3
import io,json,os,pathlib,subprocess,sys,tarfile,tempfile,unittest
SCRIPT=pathlib.Path(__file__).with_name('mswc_resume_extract.py')
class ResumeTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.p=pathlib.Path(self.tmp.name);self.out=self.p/'out'
  for name,files in [('audio.tar.gz',{'en/clips/fin/a.opus':b'audio1','en/clips/fin/b.opus':b'audio2'}),('align.tar.gz',{'align/a.TextGrid':b'first','align/b.TextGrid':b'second'})]:
   with tarfile.open(self.p/name,'w:gz') as t:
    for path,data in files.items():
     info=tarfile.TarInfo(path);info.size=len(data);t.addfile(info,io.BytesIO(data))
  (self.p/'gaps.json').write_text(json.dumps([{'spoken':'fin'}]))
  self.base=[sys.executable,str(SCRIPT),'--audio',str(self.p/'audio.tar.gz'),'--alignments',str(self.p/'align.tar.gz'),'--gaps',str(self.p/'gaps.json'),'--out',str(self.out),'--previous-pid','99999999']
 def tearDown(self):self.tmp.cleanup()
 def run_tool(self,*args):return subprocess.run(self.base+list(args),capture_output=True,text=True)
 def test_resume_and_mismatch(self):
  result=self.run_tool();self.assertEqual(result.returncode,0,result.stderr)
  report=json.loads((self.out/'extract-report.json').read_text());self.assertEqual(report['counts']['fin'],2);self.assertEqual(report['alignment_missing'],[])
  (self.out/'samples'/'fin-2.opus').unlink();(self.out/'alignment'/'a.TextGrid').unlink()
  resumed=self.run_tool();self.assertEqual(resumed.returncode,0,resumed.stderr)
  target=self.out/'samples'/'fin-1.opus';target.write_bytes(b'changed')
  bad=self.run_tool();self.assertNotEqual(bad.returncode,0);self.assertIn('refusing overwrite',bad.stderr);self.assertEqual(target.read_bytes(),b'changed')
 def test_running_and_lock(self):
  busy=self.run_tool('--previous-pid',str(os.getpid()));self.assertNotEqual(busy.returncode,0);self.assertIn('still active',busy.stderr)
  self.out.mkdir();(self.out/'.extract.lock').mkdir();locked=self.run_tool();self.assertNotEqual(locked.returncode,0);self.assertIn('lock exists',locked.stderr)
 def test_running_source_script(self):
  import time
  source=self.p/'run.py';source.write_text('import time; time.sleep(10)\n'); proc=subprocess.Popen([sys.executable,str(source)])
  try:
   time.sleep(.1);r=self.run_tool();self.assertNotEqual(r.returncode,0);self.assertIn('source download/extraction job still running',r.stderr)
  finally:proc.terminate();proc.wait()
if __name__=='__main__':unittest.main()
