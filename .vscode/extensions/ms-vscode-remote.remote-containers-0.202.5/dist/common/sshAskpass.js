var g=Object.create;var n=Object.defineProperty;var A=Object.getOwnPropertyDescriptor;var h=Object.getOwnPropertyNames;var E=Object.getPrototypeOf,u=Object.prototype.hasOwnProperty;var v=s=>n(s,"__esModule",{value:!0});var I=(s,e,c)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of h(e))!u.call(s,o)&&o!=="default"&&n(s,o,{get:()=>e[o],enumerable:!(c=A(e,o))||c.enumerable});return s},S=s=>I(v(n(s!=null?g(E(s)):{},"default",s&&s.__esModule&&"default"in s?{get:()=>s.default,enumerable:!0}:{value:s,enumerable:!0})),s);var d=S(require("net")),f=S(require("child_process")),l=process.env.VSCODE_SSH_ASKPASS_HANDLE;l||(console.error("VSCODE_SSH_ASKPASS_HANDLE not set."),process.exit(1));var m=process.argv.slice(2),i=process.env.VSCODE_SSH_ASKPASS_COUNTER;if(process.platform==="win32"){let e=f.execSync('wmic process where (commandline like "%ssh-askpass.bat%") get processid,parentprocessid /format:csv').toString().split(/\r?\n/).map(r=>r.trim()).filter(r=>!!r).map(r=>r.split(",")),c=e.shift(),p=e.map(r=>r.reduce((a,P,_)=>(a[c[_]]=P,a),{})).find(r=>r.ProcessId===String(process.ppid));p&&(i=p.ParentProcessId)}else i=m.shift();var t=d.connect(l,()=>{t.write(JSON.stringify({prompt:m.join(" "),counter:i})+`
`,s=>{s&&(console.error(s),process.exit(1))})});t.setEncoding("utf8");t.on("data",s=>{process.stdout.write(s)});t.on("error",s=>{console.error(s),process.exit(1)});t.on("end",()=>{process.exit(0)});
//# sourceMappingURL=sshAskpass.js.map
