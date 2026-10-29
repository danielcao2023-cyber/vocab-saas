#!/usr/bin/env python3
"""Rescan complete local MSWC archives safely; never touches application data."""
import argparse, hashlib, json, os, pathlib, re, tarfile, subprocess, shlex


def live(pid):
    try: os.kill(pid, 0)
    except ProcessLookupError: return False
    except PermissionError: return True
    return True


def reject_running_source_job(audio):
    script = str(audio.parent / 'run.py')
    output = subprocess.check_output(['ps', '-axo', 'pid=,command='], text=True)
    for line in output.splitlines():
        fields=line.strip().split(None, 1)
        if len(fields)!=2: continue
        try: words=shlex.split(fields[1])
        except ValueError: continue
        for word in words:
            if word.startswith('/') and str(pathlib.Path(word).resolve()) == script:
                raise RuntimeError(f'source download/extraction job still running: PID {fields[0]}')


def write_verified(path, data):
    digest = hashlib.sha256(data).hexdigest()
    try:
        with path.open('xb') as out:
            out.write(data); out.flush(); os.fsync(out.fileno())
    except FileExistsError:
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            raise RuntimeError(f'existing file differs; refusing overwrite: {path}')
    return digest


def main():
    p = argparse.ArgumentParser()
    for name in ('audio', 'alignments', 'gaps', 'out'): p.add_argument('--'+name, required=True)
    p.add_argument('--previous-pid', required=True, type=int)
    p.add_argument('--per-label', type=int, default=2)
    args = p.parse_args()
    if args.previous_pid < 1 or args.per_label < 1: p.error('positive PID and per-label required')
    if live(args.previous_pid): raise RuntimeError(f'previous job PID {args.previous_pid} still active')
    audio=pathlib.Path(args.audio).resolve(strict=True); alignments=pathlib.Path(args.alignments).resolve(strict=True); gaps=pathlib.Path(args.gaps).resolve(strict=True)
    if audio.name.endswith('.part') or alignments.name.endswith('.part'): raise RuntimeError('partial downloads are not complete archives')
    reject_running_source_job(audio)
    root=pathlib.Path(args.out).resolve(); root.mkdir(parents=True, exist_ok=True)
    lock=root/'.extract.lock'
    try: lock.mkdir()
    except FileExistsError: raise RuntimeError(f'lock exists; verify its owner and remove only if stale: {lock}')
    try:
        (lock/'pid').write_text(str(os.getpid())+'\n')
        if live(args.previous_pid): raise RuntimeError(f'previous job PID {args.previous_pid} became active')
        reject_running_source_job(audio)
        data=json.loads(gaps.read_text()); targets={x['spoken'].casefold() for x in data}; counts={x:0 for x in targets}; entries=[]
        samples=root/'samples'; samples.mkdir(exist_ok=True)
        with tarfile.open(audio,'r|gz') as t:
            for m in t:
                parts=pathlib.PurePosixPath(m.name).parts
                if len(parts)!=4 or parts[:2]!=('en','clips') or parts[2] not in targets or counts[parts[2]]>=args.per_label or not m.isfile() or not parts[3].endswith('.opus') or not 0<m.size<=1000000: continue
                f=t.extractfile(m)
                if f is None: continue
                payload=f.read(); label=parts[2]; counts[label]+=1
                name=label+'-'+str(counts[label])+'.opus'
                if not re.fullmatch(r'[a-z0-9_\'-]+-\d+\.opus',name): raise RuntimeError(f'unsafe label: {label}')
                sha=write_verified(samples/name,payload)
                entries.append({'label':label,'archive_member':m.name,'file':f'samples/{name}','sha256':sha})
                if all(n>=args.per_label for n in counts.values()): break
        wanted={pathlib.PurePosixPath(x['archive_member']).stem+'.TextGrid' for x in entries}; found={}; align_dir=root/'alignment';align_dir.mkdir(exist_ok=True)
        with tarfile.open(alignments,'r|gz') as t:
            for m in t:
                name=pathlib.PurePosixPath(m.name).name
                if name not in wanted or not m.isfile() or not 0<m.size<=1000000:continue
                f=t.extractfile(m)
                if f is None:continue
                digest=write_verified(align_dir/name,f.read());found[name]={'archive_member':m.name,'sha256':digest};wanted.remove(name)
                if not wanted:break
        report={'samples':entries,'counts':counts,'alignments':found,'alignment_missing':sorted(wanted)}
        content=(json.dumps(report,ensure_ascii=False,sort_keys=True,indent=2)+'\n').encode()
        write_verified(root/'extract-report.json',content)
        print(json.dumps({'labels':len(targets),'samples':len(entries),'alignment_missing':len(wanted)},ensure_ascii=False))
    finally:
        (lock/'pid').unlink(missing_ok=True);lock.rmdir()

if __name__=='__main__': main()
