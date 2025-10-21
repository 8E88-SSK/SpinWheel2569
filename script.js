// Global variable to store all wheel settings
// *** แก้ไข: เปลี่ยนค่าเริ่มต้นให้เป็นค่าว่างเพื่อให้ผู้ใช้ต้องกรอก ***
let allWheelsData = [{ prizes: ['', ''] }];

// เปิด Event Listener หลักเพียงครั้งเดียว
document.addEventListener('DOMContentLoaded', () => {

    // ------------------------------------------------------------------
    // --- โค้ดส่วน Page 1: ตั้งค่าวงล้อ (2 รางวัลคงที่) ---
    // ------------------------------------------------------------------

    if (document.querySelector('.page1')) {
        const wheelsContainer = document.getElementById('wheelsSettingsContainer');
        const addWheelBtn = document.getElementById('addWheelBtn');
        const removeWheelBtn = document.getElementById('removeWheelBtn');
        const wheelCountDisplay = document.getElementById('wheelCountDisplay');
        const generateWheelBtn = document.getElementById('generateWheelBtn');

        function updateWheelCountDisplay() {
            wheelCountDisplay.textContent = allWheelsData.length;
        }

        function renderWheelSettings() {
            wheelsContainer.innerHTML = '';
            allWheelsData.forEach((wheel, index) => {
                // *** ใช้ค่าจาก Array โดยตรงและกำหนด fallback เป็น '' ***
                const prize1Value = wheel.prizes[0] || '';
                const prize2Value = wheel.prizes[1] || '';
                
                const wheelDiv = document.createElement('div');
                wheelDiv.className = 'wheel-setting-block';
                wheelDiv.innerHTML = `
                    <h3>วงล้อที่ ${index + 1} (2 รางวัล)</h3>
                    <div id="prizesList${index}">
                        <div class="prize-item">
                            <input type="text" value="${prize1Value}" placeholder="ใส่ชื่อรางวัล 1" onchange="window.updatePrizeName(${index}, 0, this.value)">
                        </div>
                         <div class="prize-item">
                            <input type="text" value="${prize2Value}" placeholder="ใส่ชื่อรางวัล 2" onchange="window.updatePrizeName(${index}, 1, this.value)">
                        </div>
                    </div>
                `;
                wheelsContainer.appendChild(wheelDiv);
            });
            updateWheelCountDisplay();
        }

        // ฟังก์ชันจัดการรางวัล (ถูกปรับให้จัดการ 2 รางวัลคงที่)
        window.updatePrizeName = (wheelIndex, prizeIndex, newName) => {
            // ตรวจสอบให้แน่ใจว่า Array มีขนาด 2
            if (allWheelsData[wheelIndex].prizes.length < 2) {
                 allWheelsData[wheelIndex].prizes = ['', ''];
            }
            allWheelsData[wheelIndex].prizes[prizeIndex] = newName;
        };

        addWheelBtn.addEventListener('click', () => {
            allWheelsData.push({ prizes: ['', ''] }); // เพิ่มวงล้อใหม่ด้วย 2 รางวัลเริ่มต้นเป็นค่าว่าง
            renderWheelSettings();
        });

        removeWheelBtn.addEventListener('click', () => {
            if (allWheelsData.length > 1) {
                allWheelsData.pop();
                renderWheelSettings();
            }
        });

        // Event Listener สำหรับปุ่มสร้างวงล้อ
        generateWheelBtn.addEventListener('click', () => {
            // *** การตรวจสอบความถูกต้องยังคงใช้ logic เดิม แต่ตอนนี้จะทำงานได้แม่นยำขึ้นเพราะค่าเริ่มต้นเป็นค่าว่าง ***
            const hasValidPrizes = allWheelsData.every(wheel => 
                wheel.prizes.length === 2 && 
                wheel.prizes.every(p => p && p.trim() !== '')
            );

            if (!hasValidPrizes) {
                alert('กรุณาตั้งชื่อรางวัล 2 รายการสำหรับทุกวงล้อ และห้ามว่างเปล่า!');
                return; 
            }
            
            const spinTime = document.getElementById('spinTimeSelect').value;
            const dataToShare = {
                wheels: allWheelsData,
                time: spinTime
            };
            const encodedData = btoa(encodeURIComponent(JSON.stringify(dataToShare))); 
            window.location.href = `page2.html?data=${encodedData}`; 
        });

        // Initial render
        renderWheelSettings();
    } 
    
    // ------------------------------------------------------------------
    // --- โค้ดส่วน Page 2: หมุนวงล้อ (ประวัติ 10 ค่าล่าสุด) ---
    // ------------------------------------------------------------------

    if (document.querySelector('.page2')) {
        const wheelsContainer = document.getElementById('wheelsDisplayContainer');
        const spinAllBtn = document.getElementById('spinAllBtn');
        const shareLinkBtn = document.getElementById('shareLinkBtn');
        const popup = document.getElementById('resultPopup');
        const popupDetails = document.getElementById('popupResultDetails');
        const popupOkBtn = document.getElementById('popupOkBtn');
        
        const spinSound = document.getElementById('spinSound');
        const winSound = document.getElementById('winSound');

        let loadedWheelsData = [];
        let spinDuration = 2; 

        // Colors for wheel slices 
        const pastelColors = [
            "#FFB6C1", "#ADD8E6", "#FFD1DC", "#87CEFA", 
            "#98FB98", "#B0E0E6", "#FAFAD2", "#FFE4E1",
            "#F0FFF0", "#FFFACD" 
        ];
        
        // --- Pop-up Controls ---
        popupOkBtn.addEventListener('click', () => popup.style.display = 'none');
        
        // --- Sound Functions ---
        function playSpinSound() {
             spinSound.loop = true;
             spinSound.play().catch(e => console.log('Autoplay blocked for spin sound:', e)); 
        }

        function stopSpinSound() {
             spinSound.pause();
             spinSound.currentTime = 0;
        }

        function playWinSound() {
             winSound.play().catch(e => console.log('Autoplay blocked for win sound:', e));
        }

        // --- Load Data from URL ---
        const params = new URLSearchParams(window.location.search);
        const encodedData = params.get('data');

        if (encodedData) {
            try {
                const decodedJsonString = decodeURIComponent(atob(encodedData)); 
                const decodedData = JSON.parse(decodedJsonString);
                
                loadedWheelsData = decodedData.wheels.map(wheel => ({
                    ...wheel,
                    prizes: wheel.prizes.filter(p => p.trim() !== ''),
                    currentRotation: 0,
                    result: 'ยังไม่มีการสุ่ม',
                    isSpinning: false,
                    history: [], 
                })).filter(wheel => wheel.prizes.length === 2); 
                
                spinDuration = parseInt(decodedData.time);

                if (loadedWheelsData.length === 0) throw new Error("No valid wheels data (Must have 2 prizes per wheel).");

                if (loadedWheelsData.length > 1) {
                    spinAllBtn.style.display = 'block';
                } else {
                    spinAllBtn.style.display = 'none';
                }
            } catch (e) {
                console.error("Error decoding wheel data:", e);
                alert("ข้อมูลวงล้อผิดพลาด! กรุณาตั้งค่าใหม่");
                window.location.href = 'index.html';
                return;
            }
        } else {
            // No data, redirect to Page 1
            window.location.href = 'index.html';
            return;
        }

        // --- Core Spinning Logic ---

        function drawWheel(canvas, prizes, rotation) {
            const ctx = canvas.getContext('2d');
            const totalPrizes = prizes.length;
            const arc = (2 * Math.PI) / totalPrizes;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = centerX - 5;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 0; i < totalPrizes; i++) {
                const startAngle = i * arc; 
                const endAngle = (i + 1) * arc;

                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.lineTo(centerX, centerY);
                ctx.fillStyle = pastelColors[i % pastelColors.length];
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw Text
                ctx.save();
                ctx.fillStyle = '#333';
                ctx.font = '14px Kanit, sans-serif';
                ctx.textAlign = 'center';
                
                const textAngle = startAngle + arc / 2;
                ctx.translate(centerX + Math.cos(textAngle) * radius * 0.7, 
                               centerY + Math.sin(textAngle) * radius * 0.7);
                ctx.rotate(textAngle + Math.PI / 2);
                ctx.fillText(prizes[i], 0, 0);
                ctx.restore();
            }

            // Apply rotation (CSS handles the animation)
            canvas.style.transition = `transform ${spinDuration}s cubic-bezier(0.1, 0.9, 0.4, 1)`;
            canvas.style.transform = `rotate(${rotation}deg)`;
        }

        function getPrize(finalRotation, prizes) {
            const totalPrizes = prizes.length;
            const anglePerPrize = 360 / totalPrizes;
            
            // การคำนวณตำแหน่งที่ถูกต้องเมื่อลูกศรอยู่ด้านบน (270 องศา)
            const normalizedAngle = (-finalRotation % 360 + 360) % 360;
            const pointerAngle = 270; 
            const relativeAngle = (normalizedAngle - pointerAngle + 360) % 360;
            
            // แปลงจาก CW (CSS/หมุนจริง) เป็น CCW (การวาด Canvas)
            const reversedAngle = (360 - relativeAngle) % 360;
            
            // คำนวณ Index
            let prizeIndex = Math.floor(reversedAngle / anglePerPrize);
            
            return prizes[prizeIndex % totalPrizes];
        }

        function updateHistoryDisplay(wheelIndex) {
            const historyList = document.getElementById(`latestHistory${wheelIndex}`);
            const wheelData = loadedWheelsData[wheelIndex];
            
            // แสดงประวัติ 10 รายการล่าสุด
            const recentHistory = wheelData.history.slice(-10).reverse(); 

            historyList.innerHTML = recentHistory.map((result, index) => {
                const number = wheelData.history.length - index;
                return `<li>#${number}: ${result}</li>`;
            }).join('');
            
            // เลื่อนไปที่รายการล่าสุด
            historyList.scrollTop = historyList.scrollHeight;
        }

        // ฟังก์ชันหมุนวงล้อหลัก (กำหนดให้เป็น window object เพื่อให้เรียกใช้จาก onclick ได้)
        window.spinWheel = (wheelIndex) => {
            const wheelData = loadedWheelsData[wheelIndex];
            const canvas = document.getElementById(`prizeWheel${wheelIndex}`);
            const spinBtn = document.getElementById(`spinBtn${wheelIndex}`);
            
            if (wheelData.isSpinning) return;
            wheelData.isSpinning = true;
            
            const startRotation = wheelData.currentRotation || 0;
            
            // หมุน 10 รอบ + สุ่มตำแหน่งหยุด
            const minRotations = 10; 
            const extraRotation = Math.floor(Math.random() * 360);
            const totalDegreesToSpin = (minRotations * 360) + extraRotation;
            const finalRotation = startRotation - totalDegreesToSpin; 
            
            spinBtn.disabled = true;
            spinBtn.textContent = "กำลังหมุน...";
            
            playSpinSound();
            
            // Apply rotation
            canvas.style.transition = `transform ${spinDuration}s cubic-bezier(0.1, 0.9, 0.4, 1)`;
            canvas.style.transform = `rotate(${finalRotation}deg)`;

            return new Promise(resolve => {
                setTimeout(() => {
                    stopSpinSound();
                    
                    const prize = getPrize(finalRotation, wheelData.prizes);
                    wheelData.result = prize;
                    
                    // บันทึกผลลัพธ์ลงใน History
                    wheelData.history.push(prize);
                    updateHistoryDisplay(wheelIndex);

                    document.getElementById(`latestResult${wheelIndex}`).textContent = prize; 
                    
                    // แก้ไขปัญหา 'หมุนอีกรอบ' ด้วยการปิด transition ชั่วคราว
                    canvas.style.transition = 'none'; 
                    
                    wheelData.currentRotation = finalRotation % 360;
                    canvas.style.transform = `rotate(${wheelData.currentRotation}deg)`;
                    
                    spinBtn.disabled = false;
                    spinBtn.textContent = "หมุน";
                    wheelData.isSpinning = false;

                    // เปิด transition กลับมา
                    setTimeout(() => {
                        canvas.style.transition = `transform ${spinDuration}s cubic-bezier(0.1, 0.9, 0.4, 1)`;
                    }, 50);

                    resolve({ wheelIndex, prize });
                }, spinDuration * 1000);
            });
        };
        
        // --- Render Wheels ---
        loadedWheelsData.forEach((wheel, index) => {
            const wheelDiv = document.createElement('div');
            wheelDiv.className = 'wheel-display-block';
            wheelDiv.innerHTML = `
                <h2>วงล้อที่ ${index + 1}</h2>
                <div class="wheel-container">
                    <canvas id="prizeWheel${index}" width="300" height="300"></canvas>
                    <div class="arrow"></div>
                    <button id="spinBtn${index}" onclick="window.spinWheel(${index})" class="btn-spin">หมุน</button>
                </div>
                <p>รางวัลล่าสุด: <span id="latestResult${index}">${wheel.result}</span></p>
                
                <p>ประวัติการสุ่ม (ล่าสุด 10 รายการ):</p>
                <ul id="latestHistory${index}" class="history-list">
                    </ul>
            `;
            wheelsContainer.appendChild(wheelDiv);

            drawWheel(document.getElementById(`prizeWheel${index}`), wheel.prizes, 0);
        });
        
        // --- Spin All Logic ---
        spinAllBtn.addEventListener('click', async () => {
            if (loadedWheelsData.some(w => w.isSpinning)) return;
            
            spinAllBtn.disabled = true;
            loadedWheelsData.forEach((_, index) => {
                document.getElementById(`spinBtn${index}`).disabled = true;
            });
            
            const spinPromises = loadedWheelsData.map((_, index) => 
                window.spinWheel(index)
            );
            
            const results = await Promise.all(spinPromises);
            
            playWinSound(); 
            
            // Show combined results Pop-up
            popupDetails.innerHTML = loadedWheelsData.map((w, i) => `
                <p><strong>วงล้อที่ ${i + 1}:</strong> <span class="prize-text">${w.result}</span></p>
            `).join('');
            
            popup.style.display = 'flex';
            
            // Re-enable buttons and update latest result display and history
            spinAllBtn.disabled = false;
            loadedWheelsData.forEach((_, index) => {
                document.getElementById(`spinBtn${index}`).disabled = false;
                document.getElementById(`latestResult${index}`).textContent = loadedWheelsData[index].result; 
                // อัปเดตประวัติการสุ่มทั้งหมดหลัง Spin All
                updateHistoryDisplay(index);
            });
        });
        
        // --- Share Link Logic ---
        shareLinkBtn.addEventListener('click', () => {
             const currentUrl = window.location.href;
             navigator.clipboard.writeText(currentUrl).then(() => {
                 alert("คัดลอกลิงก์สำเร็จแล้ว! คุณสามารถแชร์ลิงก์นี้ให้ผู้อื่นมาหมุนได้");
             }).catch(err => {
                 console.error('Could not copy text: ', err);
                 alert("ไม่สามารถคัดลอกลิงก์ได้ กรุณาคัดลอกด้วยตนเองจากช่อง URL ด้านบน");
             });
        });

    }
});
