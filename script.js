// Global variable to store all wheel settings
let allWheelsData = [{ prizes: ['รางวัลที่ 1', 'รางวัลที่ 2'] }];

// เปิด Event Listener หลักเพียงครั้งเดียว
document.addEventListener('DOMContentLoaded', () => {

    // ------------------------------------------------------------------
    // --- โค้ดส่วน Page 1: ตั้งค่าวงล้อ ---
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
                const wheelDiv = document.createElement('div');
                wheelDiv.className = 'wheel-setting-block';
                wheelDiv.innerHTML = `
                    <h3>วงล้อที่ ${index + 1}</h3>
                    <div id="prizesList${index}">
                        ${wheel.prizes.map((p, pIndex) => `
                            <div class="prize-item" data-prize-index="${pIndex}">
                                <input type="text" value="${p}" onchange="window.updatePrizeName(${index}, ${pIndex}, this.value)">
                                <button class="btn-icon" onclick="window.removePrize(${index}, ${pIndex})">✖</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn-secondary" onclick="window.addPrize(${index})">➕ เพิ่มชื่อรางวัล</button>
                `;
                wheelsContainer.appendChild(wheelDiv);
            });
            updateWheelCountDisplay();
        }

        // ฟังก์ชันจัดการรางวัล (กำหนดให้เป็น window object เพื่อให้เรียกใช้จาก onclick ได้)
        window.addPrize = (wheelIndex) => {
            allWheelsData[wheelIndex].prizes.push(`รางวัลใหม่ ${allWheelsData[wheelIndex].prizes.length + 1}`);
            renderWheelSettings();
        };

        window.removePrize = (wheelIndex, prizeIndex) => {
            allWheelsData[wheelIndex].prizes.splice(prizeIndex, 1);
            // ตรวจสอบว่ามีรางวัลเหลืออยู่หรือไม่ ถ้าเป็น 0 ให้เพิ่มรางวัลเริ่มต้นกลับมา
            if (allWheelsData[wheelIndex].prizes.length === 0) {
                 allWheelsData[wheelIndex].prizes.push('รางวัลเริ่มต้น');
            }
            renderWheelSettings();
        };

        window.updatePrizeName = (wheelIndex, prizeIndex, newName) => {
            allWheelsData[wheelIndex].prizes[prizeIndex] = newName;
        };

        addWheelBtn.addEventListener('click', () => {
            allWheelsData.push({ prizes: ['รางวัล A', 'รางวัล B'] });
            renderWheelSettings();
        });

        removeWheelBtn.addEventListener('click', () => {
            if (allWheelsData.length > 1) {
                allWheelsData.pop();
                renderWheelSettings();
            }
        });

        // Event Listener สำหรับปุ่มสร้างวงล้อ (แก้ไขให้ทำงานได้)
        generateWheelBtn.addEventListener('click', () => {
            // ตรวจสอบว่ามีรางวัลอย่างน้อย 1 รางวัลในแต่ละวงล้อหรือไม่
            const hasValidPrizes = allWheelsData.every(wheel => wheel.prizes.length > 0 && wheel.prizes.every(p => p.trim() !== ''));

            if (!hasValidPrizes) {
                alert('กรุณาเพิ่มชื่อรางวัลอย่างน้อย 1 รายการสำหรับทุกวงล้อ และห้ามว่างเปล่า!');
                return; 
            }
            
            const spinTime = document.getElementById('spinTimeSelect').value;
            const dataToShare = {
                wheels: allWheelsData,
                time: spinTime
            };
            // ใช้ encodeURIComponent ก่อน btoa เพื่อป้องกันปัญหาตัวอักษรพิเศษ
            const encodedData = btoa(encodeURIComponent(JSON.stringify(dataToShare))); 
            window.location.href = `page2.html?data=${encodedData}`; 
        });

        // Initial render
        renderWheelSettings();
    } 
    
    // ------------------------------------------------------------------
    // --- โค้ดส่วน Page 2: หมุนวงล้อ ---
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
            "#FFD1DC", "#FFB6C1", "#ADD8E6", "#87CEFA", 
            "#98FB98", "#B0E0E6", "#FAFAD2", "#FFE4E1",
            "#F0FFF0", "#FFFACD" // เพิ่มสีสำรอง
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
                // ต้อง decodeURIComponent ก่อน JSON.parse
                const decodedJsonString = decodeURIComponent(atob(encodedData)); 
                const decodedData = JSON.parse(decodedJsonString);
                
                loadedWheelsData = decodedData.wheels.map(wheel => ({
                    ...wheel,
                    // ตรวจสอบความถูกต้องของข้อมูล
                    prizes: wheel.prizes.filter(p => p.trim() !== ''),
                    currentRotation: 0,
                    result: 'ยังไม่มีการสุ่ม',
                    isSpinning: false,
                })).filter(wheel => wheel.prizes.length > 0);
                
                spinDuration = parseInt(decodedData.time);

                if (loadedWheelsData.length === 0) throw new Error("No valid wheels data.");

                if (loadedWheelsData.length > 1) {
                    spinAllBtn.style.display = 'block';
                } else {
                    spinAllBtn.style.display = 'none';
                }
            } catch (e) {
                console.error("Error decoding wheel data:", e);
                alert("ข้อมูลวงล้อผิดพลาด! กรุณาตั้งค่าใหม่");
                window.location.href = 'page1.html';
                return;
            }
        } else {
            // No data, redirect to Page 1
            window.location.href = 'page1.html';
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
                    
                    // *** โค้ดที่แก้ไข: อัปเดตการแสดงผลรางวัลล่าสุดสำหรับวงล้อเดี่ยว ***
                    document.getElementById(`latestResult${wheelIndex}`).textContent = prize; 
                    // ***********************************************************************

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
            
            await Promise.all(spinPromises);
            
            playWinSound(); 
            
            // Show combined results Pop-up
            popupDetails.innerHTML = loadedWheelsData.map((w, i) => `
                <p><strong>วงล้อที่ ${i + 1}:</strong> <span class="prize-text">${w.result}</span></p>
            `).join('');
            
            popup.style.display = 'flex';
            
            // Re-enable buttons and update latest result display
            spinAllBtn.disabled = false;
            loadedWheelsData.forEach((_, index) => {
                document.getElementById(`spinBtn${index}`).disabled = false;
                // โค้ดส่วนนี้ยังทำงานปกติสำหรับการอัปเดตผลรวมใน spinAll
                document.getElementById(`latestResult${index}`).textContent = loadedWheelsData[index].result; 
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
}); // ปิด Event Listener หลักเพียงครั้งเดียว