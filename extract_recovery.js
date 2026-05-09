const fs = require('fs');
const logPath = 'C:\\Users\\dgtls\\.gemini\\antigravity\\brain\\78314eeb-f264-4d84-b1d7-fb7594485b6b\\.system_generated\\logs\\overview.txt';
const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

function findAndExtract(stepIndex, outputPath) {
    console.log(`Searching for step_index: ${stepIndex}...`);
    const lineIndex = lines.findIndex(line => line.includes(`"step_index":${stepIndex}`) && line.includes('"source":"MODEL"'));
    
    if (lineIndex === -1) {
        console.error(`Step ${stepIndex} not found!`);
        return;
    }
    
    console.log(`Found step ${stepIndex} at line ${lineIndex}`);
    const data = JSON.parse(lines[lineIndex]);
    
    // Find the write_to_file tool call
    const toolCall = data.tool_calls.find(tc => tc.name === 'write_to_file');
    if (!toolCall) {
        console.error(`No write_to_file tool call in step ${stepIndex}`);
        return;
    }
    
    let code = toolCall.args.CodeContent.trim();
    try {
        if (code.startsWith('"')) {
            code = JSON.parse(code);
        }
    } catch (e) {
        code = code.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
    
    fs.writeFileSync(outputPath, code);
    console.log(`Extracted to ${outputPath}`);
}

findAndExtract(752, 'd:\\web\\nuclear\\recovered_cart.txt');
findAndExtract(757, 'd:\\web\\nuclear\\recovered_header.txt');
