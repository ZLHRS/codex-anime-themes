param([Parameter(Mandatory=$true)][string]$Run,[ValidateSet('standard','final')][string]$Phase='standard',[string]$ChromaKey='#00FF00',[ValidateRange(0,1)][double]$DespillStrength=1)
$ErrorActionPreference='Stop'
$petPython='C:/Users/shayk/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
$petScripts='C:/Users/shayk/.codex/plugins/cache/openai-curated-remote/work-pets/0.1.6/skills/create-pet/scripts'
function PetStep([string]$Script,[string[]]$Arguments){
 & $petPython (Join-Path $petScripts $Script) @Arguments
 if($LASTEXITCODE -ne 0){throw "Pet QA stopped at $Script"}
}
if($Phase -eq 'standard'){
 PetStep 'extract_strip_frames.py' @('--decoded-dir',"$Run/decoded",'--output-dir',"$Run/frames",'--states','all','--method','components','--chroma-key',$ChromaKey)
 PetStep 'inspect_frames.py' @('--frames-root',"$Run/frames",'--json-out',"$Run/qa/review.json",'--require-components')
 PetStep 'compose_atlas.py' @('--frames-root',"$Run/frames",'--output',"$Run/final/spritesheet.png")
 PetStep 'make_contact_sheet.py' @("$Run/final/spritesheet.png",'--output',"$Run/qa/contact-sheet.png")
 PetStep 'render_animation_previews.py' @('--frames-root',"$Run/frames",'--output-dir',"$Run/previews")
}else{
 if(Test-Path "$Run/qa/chroma-despill-extended.json"){throw 'Final despill already exists; do not repeat it on the same artifact.'}
 PetStep 'despill_chroma_edges.py' @("$Run/final/spritesheet-extended-raw.png",'--output',"$Run/final/spritesheet-extended.png",'--json-out',"$Run/qa/chroma-despill-extended.json",'--chroma-key',$ChromaKey,'--strength',$DespillStrength.ToString([System.Globalization.CultureInfo]::InvariantCulture))
 PetStep 'validate_atlas.py' @("$Run/final/spritesheet-extended.png",'--require-v2','--chroma-key',$ChromaKey,'--json-out',"$Run/final/validation-extended.json")
 PetStep 'make_contact_sheet.py' @("$Run/final/spritesheet-extended.png",'--output',"$Run/qa/contact-final.png")
 PetStep 'make_direction_qa_sheet.py' @("$Run/final/spritesheet-extended.png",'--output',"$Run/qa/directions.png")
 PetStep 'measure_direction_continuity.py' @("$Run/final/spritesheet-extended.png",'--json-out',"$Run/qa/look-continuity.json")
 PetStep 'make_direction_blind_qa_sheet.py' @("$Run/final/spritesheet-extended.png",'--output',"$Run/qa/blind.png",'--answer-key',"$Run/qa/blind-key.json")
 & $petPython pets/render-final-preview.py $Run
 if($LASTEXITCODE -ne 0){throw 'Preview rendering failed'}
}
