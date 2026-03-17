import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function parseIntent(text) {
    return new Promise((resolve, reject) => {
        // Path to the python executable in the venv
        const venvPath = path.resolve(__dirname, '..', 'venv', 'Scripts', 'python.exe');
        const scriptPath = path.resolve(__dirname, '..', 'ai', 'intent_parser.py');
        
        let pythonExecutable = venvPath;
        if (!import.meta.url.includes('venv')) {
             // Let's just use "python" directly from the system path to be safe,
             // as the venv path might not exist or be valid on this OS.
             pythonExecutable = 'python';
        }
        
        const pythonProcess = spawn(pythonExecutable, [scriptPath, text]);
        
        pythonProcess.on('error', (err) => {
            console.error('Failed to start python process:', err);
            reject(new Error(`Failed to start intent parser: ${err.message}`));
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}. Error: ${errorOutput}`);
                reject(new Error(`Failed to parse intent: ${errorOutput}`));
                return;
            }
            
            try {
                // Ensure output isn't empty and parse JSON string
                if (output.trim()) {
                    const parsed = JSON.parse(output.trim());
                    if (parsed.error) {
                       reject(new Error(parsed.error));
                    } else {
                       resolve(parsed);
                    }
                } else {
                    reject(new Error('Empty response from python script'));
                }
            } catch (e) {
                console.error("Error parsing JSON from python script:", output, e);
                reject(new Error(`Failed to parse output from intent parser: ${output}`));
            }
        });
    });
}
