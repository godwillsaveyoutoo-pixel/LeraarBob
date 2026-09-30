/* Shared local PDF writer; pages use browser fonts, including names and math symbols. */
(function(root){
'use strict';
function pdf(pages){
 const encoder=new TextEncoder(),chunks=[],offsets=[0];let length=0;
 const add=data=>{const bytes=typeof data==='string'?encoder.encode(data):data;chunks.push(bytes);length+=bytes.length};
 const object=(id,body)=>{offsets[id]=length;add(`${id} 0 obj\n`);add(body);add('\nendobj\n')};
 const stream=(id,dict,bytes)=>{offsets[id]=length;add(`${id} 0 obj\n<< ${dict} /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n')};
 add('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
 pages.forEach((page,i)=>{
  const id=3+i*3;
  object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Image ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
  stream(id+1,`/Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,page.bytes);
  stream(id+2,'',encoder.encode('q\n595.28 0 0 841.89 0 0 cm\n/Image Do\nQ'));
 });
 const start=length;add(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
 for(const offset of offsets.slice(1))add(`${String(offset).padStart(10,'0')} 00000 n \n`);
 add(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
 return new Blob(chunks,{type:'application/pdf'});
}
const api=Object.freeze({pdf});if(typeof module==='object'&&module.exports)module.exports=api;else root.LeraarBobProofPDF=api;
})(globalThis);
