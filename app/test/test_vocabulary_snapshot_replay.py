import copy
import importlib.util
import json
import tempfile
import unittest
from unittest import mock
import os
from pathlib import Path

spec = importlib.util.spec_from_file_location('snapshot_replay', Path('scripts/replay-vocabulary-snapshot.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class SnapshotReplayTests(unittest.TestCase):
    def setUp(self):
        self.before={'version':1,'books':[],'units':[],'entries':[{'key':'a','meaning':'old'},{'key':'b','meaning':'b'}]}
        self.after={'version':2,'books':[],'units':[],'entries':[{'key':'c','meaning':'new'},{'key':'a','meaning':'new'}]}
        self.snapshot=mod.make_snapshot(mod.encode(self.before),mod.encode(self.after))

    def test_roundtrip_changes_and_order_are_exact(self):
        self.assertEqual(mod.apply_snapshot(mod.encode(self.before),self.snapshot),mod.encode(self.after))
        self.assertEqual(self.before['entries'][0]['meaning'],'old')

    def test_mismatch_hash_and_conflicting_old_value_rejected(self):
        changed=copy.deepcopy(self.before);changed['entries'][0]['meaning']='unexpected'
        with self.assertRaises(ValueError):mod.apply_snapshot(mod.encode(changed),self.snapshot)
        forged=copy.deepcopy(self.snapshot);forged['baselineSha256']=mod.sha(mod.encode(changed))
        with self.assertRaises(ValueError):mod.apply_snapshot(mod.encode(changed),forged)

    def test_missing_duplicate_or_tampered_order_and_target_rejected(self):
        for order in [['a','a'],['a'],['a','missing']]:
            snapshot=copy.deepcopy(self.snapshot);snapshot['afterOrder']=order
            with self.assertRaises(ValueError):mod.apply_snapshot(mod.encode(self.before),snapshot)
        snapshot=copy.deepcopy(self.snapshot);snapshot['targetSha256']='0'*64
        with self.assertRaises(ValueError):mod.apply_snapshot(mod.encode(self.before),snapshot)

    def test_tampered_changes_and_duplicate_change_key_rejected(self):
        snapshot=copy.deepcopy(self.snapshot);snapshot['changes'][0]['after']={'key':snapshot['changes'][0]['key'],'meaning':'tampered'}
        with self.assertRaises(ValueError):mod.apply_snapshot(mod.encode(self.before),snapshot)
        snapshot=copy.deepcopy(self.snapshot);snapshot['changes'].append(snapshot['changes'][0])
        with self.assertRaises(ValueError):mod.apply_snapshot(mod.encode(self.before),snapshot)

    def test_duplicate_keys_rejected(self):
        duplicate=copy.deepcopy(self.before);duplicate['entries'].append(duplicate['entries'][0])
        with self.assertRaises(ValueError):mod.make_snapshot(mod.encode(duplicate),mod.encode(self.after))

    def test_failed_write_removes_only_created_file(self):
        class BrokenWriter:
            def __init__(self, fd): self.fd = fd
            def __enter__(self): return self
            def write(self, raw): raise OSError('disk full')
            def __exit__(self, *_): os.close(self.fd)
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'result.json'
            with mock.patch.object(mod.os, 'fdopen', side_effect=lambda fd, mode: BrokenWriter(fd)):
                with self.assertRaises(OSError): mod.write_new_temporary(p, b'abc')
            self.assertFalse(p.exists())

    def test_output_restricted_to_new_temp_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'result.json';mod.write_new_temporary(p,b'abc');self.assertEqual(p.read_bytes(),b'abc')
            with self.assertRaises(ValueError):mod.write_new_temporary(p,b'def')
            self.assertEqual(p.read_bytes(),b'abc')
            link=Path(tmp)/'link.json';link.symlink_to(p)
            with self.assertRaises(ValueError):mod.write_new_temporary(link,b'def')
            self.assertEqual(p.read_bytes(),b'abc')
            with self.assertRaises(ValueError):mod.write_new_temporary(Path('data/vocabulary/catalog.json'),b'x')

if __name__=='__main__':unittest.main()
