// ================== CALCULATOR FUNCTIONS ==================
        const display = document.getElementById('display');
        const historyList = document.getElementById('history-list');

        document.addEventListener('keydown', (event) => {
            const modal = document.getElementById('calculatorModal');
            if (modal.style.display !== 'flex') return;
            const key = event.key;
            if (/[0-9]/.test(key)) addToDisplay(key);
            else if (['+', '-', '*', '/', '.'].includes(key)) addToDisplay(key);
            else if (key === 'Enter') { calculate(); event.preventDefault(); }
            else if (key === 'Backspace') deleteLast();
            else if (key === 'Escape') clearDisplay();
        });

        function addToDisplay(input) {
            if (display.value === '0' || display.value === 'Error') display.value = input;
            else display.value += input;
        }

        function clearDisplay() { display.value = '0'; }

        function deleteLast() {
            display.value = display.value.slice(0, -1);
            if (display.value === '') display.value = '0';
        }

        function calculate() {
            try {
                const result = eval(display.value);
                if (display.value !== String(result)) addHistoryItem(display.value + ' = ' + result);
                display.value = result;
            } catch (error) { display.value = 'Error'; }
        }

        function addHistoryItem(text) {
            const li = document.createElement('li');
            li.textContent = text;
            li.className = "text-[10px] text-white/60 border-b border-white/5 py-1";
            if(historyList.innerHTML.includes('No calculations')) historyList.innerHTML = '';
            historyList.prepend(li);
            if (historyList.children.length > 3) historyList.removeChild(historyList.lastChild);
        }

        function openCalculator() {
            document.getElementById('calculatorModal').style.display = 'flex';
            document.getElementById('calcContainer').focus();
        }

        function closeCalculator() { document.getElementById('calculatorModal').style.display = 'none'; }
        function toggleCalcSize() { document.getElementById('calcContainer').classList.toggle('large'); }

        window.onclick = function (event) {
            const modal = document.getElementById('calculatorModal');
            if (event.target == modal) closeCalculator();
        }