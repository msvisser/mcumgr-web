class Shell {
    constructor(element) {
        this._history = [];
        this._historyIndex = 0;
        this._cursorPosition = 0;
        this._currentCommand = "";
        this._executing = false;

        this._commandCallback = null;

        this._terminal = new Terminal();
        this._terminal.open(element);
        this._terminal.resize(120, 40);
        this._terminal.prompt = () => {
            this._terminal.write('> ');
        };
        this._terminal.prompt();
        this._terminal.onData(this._onData.bind(this));
    }

    clear() {
        this._terminal.clear();
        this._history = [];
        this._historyIndex = 0;
        this._cursorPosition = 0;
        this._currentCommand = "";
    }

    finishCommand(data) {
        this._terminal.write(data);
        this._terminal.prompt();
        this._executing = false;
    }

    onCommand(callback) {
        this._commandCallback = callback;
        return this;
    }

    async _onData(e) {
        if (this._executing) return; // Ignore input while command is executing

        switch (e) {
            case '\u0003': // Ctrl+C
                this._currentCommand = '';
                this._cursorPosition = 0;
                this._historyIndex = 0;
                this._terminal.writeln('^C');
                this._terminal.prompt();
                break;
            case '\u001b[A': // Up
                if (this._historyIndex > -this._history.length) {
                    this._historyIndex -= 1;

                    this._terminal.write('\u001b[0G');
                    this._terminal.prompt();

                    const newCommand = this._history.at(this._historyIndex);
                    this._currentCommand = newCommand;
                    this._terminal.write(newCommand);

                    this._terminal.write('\u001b[0K');
                }
                break;
            case '\u001b[B': // Down
                if (this._historyIndex < 0) {
                    this._historyIndex += 1;

                    this._terminal.write('\u001b[0G');
                    this._terminal.prompt();

                    if (this._historyIndex < 0) {
                        const newCommand = this._history.at(this._historyIndex);
                        this._currentCommand = newCommand;
                        this._terminal.write(newCommand);
                    } else {
                        this._currentCommand = "";
                    }

                    this._terminal.write('\u001b[0K');
                }
                break;
            case '\u001b[C': // Right
                if (this._cursorPosition < 0) {
                    this._cursorPosition += 1;
                    this._terminal.write('\u001b[1C');
                }
                break;
            case '\u001b[D': // Left
                if (this._cursorPosition > -this._currentCommand.length) {
                    this._cursorPosition -= 1;
                    this._terminal.write('\u001b[1D');
                }
                break;
            case '\r': // Enter
                if (this._currentCommand != "") {
                    if (this._commandCallback) {
                        this._commandCallback(this._currentCommand);
                    }
                    this._history.push(this._currentCommand);
                    this._currentCommand = '';
                    this._cursorPosition = 0;
                    this._historyIndex = 0;
                    this._executing = true;
                }
                break;
            case '\u007F': // Backspace (DEL)
                // Do not delete the prompt
                if (this._cursorPosition == 0) {
                    if (this._currentCommand.length > 0) {
                        this._terminal.write('\b \b');
                        this._currentCommand = this._currentCommand.slice(0, this._currentCommand.length - 1);
                    }
                } else if (this._cursorPosition > -this._currentCommand.length) {
                    const newShellCommand = this._currentCommand.slice(0, this._cursorPosition - 1) + this._currentCommand.slice(this._cursorPosition);
                    this._terminal.write('\b');
                    this._terminal.write(this._currentCommand.slice(this._cursorPosition));
                    this._terminal.write('\u001b[0K\u001b[' + -this._cursorPosition + 'D');
                    this._currentCommand = newShellCommand;
                }
                break;
            default: // Print all other characters for demo
                if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                    if (this._cursorPosition == 0) {
                        this._currentCommand += e;
                        this._terminal.write(e);
                    } else {
                        const newShellCommand = this._currentCommand.slice(0, this._cursorPosition) + e + this._currentCommand.slice(this._cursorPosition);
                        this._terminal.write(e);
                        this._terminal.write(this._currentCommand.slice(this._cursorPosition));
                        this._terminal.write('\u001b[' + -this._cursorPosition + 'D');
                        this._currentCommand = newShellCommand;
                    }
                }
                break;
        }
    }
}
