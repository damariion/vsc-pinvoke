import { readFileSync } from "fs";
import { join, dirname } from "path";

const root = join(dirname(__dirname));
class param { type?: string; id?: string; };

function from_function(lines: string[], meta: string): any
{
    const dll = meta.match(/dll:(\w+)/)?.[1];

    // signature
    const header = lines[1].match(/^(\w+)\s+(\w+)\s*\(/);
    const ret = header?.[1];
    const id  = header?.[2];

    // params
    const block = lines.slice(2).join('\n');
    const pattern = /^\s*(?:\[[^\]]*\])?\s*(\w+(?:\s*\*?)*)\s+(\w+)/gm;

    let   match;
    const params = [];

    while ((match = pattern.exec(block)) !== null)
        params.push({ type: match[1].trim(), id: match[2].trim() } as param);
        
    return [dll, ret, id, params];
}

// function from_type(lines: string[], meta: string): any
// {
//     ;;
// }

function tokenize(raw: string): any
{
    const lines = raw.trim().replace('*', '').split('\n');

    // metadata
    const meta = lines[0];
    const type = meta.match(/type:(\w+)/)?.[1];
    
    switch (type)
    {
        case "func": 
            return [type, ...from_function(lines, meta)]
        
        // case "type":
        //     return [type, ...from_type(lines, meta)]
    }
}

function cast(ret: string, params: param[], lang: string, root: string): any
{
    const map = JSON.parse(readFileSync(
        join(root, "data", "types.json")).toString());
    
    params.forEach(
        x => x.type = map[lang][x.type ?? ''] 
                   ?? map[lang]['*']
    );
    
    ret = map[lang][ret ?? ''] ?? map[lang]['*'];
    return [ret, params];
}

function format(type: string, dll: string, ret: string, 
    id: string, params: param[], lang: string): string
{
    let template: any = JSON.parse(readFileSync(
        join(root, "data", "format.json")).toString())[lang];
    
    let hdr = template["header"] as string;
    let prm = template["params"] as string;

    // reassigned >> method hell
    hdr = hdr.replace("<DLL>", dll);
    hdr = hdr.replace("<RET>", ret);
    hdr = hdr.replace("<ID>",  id);
    
    hdr = hdr.replace("<PARAMS>", 
        params.map(p => '\t' +
            prm.replace("<TYPE>", p.type as any)
               .replace("<ID>",   p.id as any)
        ).join(',\n')
    );

    return hdr;
}

export default function transpile(identifier: string, lang: string)
{
    // initialization
    const lib  = join(root, "data", "api");
    const raw  = readFileSync(join(lib, `${identifier}.txt`)).toString();
    
    let [type, dll, ret, id, params] = tokenize(raw);
    [ret, params] = cast(ret, params, lang, root);
    return format(type, dll, ret, id, params, lang);

}