let isAdmin = false;
const ADMIN_PASSWORD = "1234";
const sections = ["school","class","assignment","exam","notice"];
const sectionColors = {school:"#A8D0E6",assignment:"#FFE5A8",class:"#B8E6B8",exam:"#FFD8A8",notice:"#F6A8C1"};
let data = {};

// 로컬스토리지에서 데이터 불러오기
sections.forEach(sec => {
    let stored = JSON.parse(localStorage.getItem(sec));
    data[sec] = Array.isArray(stored) ? stored : [];
});

// 섹션 렌더링
function render(section){
    const list = document.getElementById(section + "List");
    list.innerHTML = "";
    data[section].forEach((item,index)=>{
        const li = document.createElement("li");
        li.textContent = item.date ? `${item.date} - ${item.event}` : item.event;

        if(isAdmin){
            const editBtn = document.createElement("button");
            editBtn.textContent = "수정";
            editBtn.className = "ml-2 text-green-600";
            editBtn.onclick = () => {
                const newDate = item.date ? prompt("날짜 수정", item.date) : null;
                const newEvent = prompt("내용 수정", item.event);
                if(item.date) item.date = newDate;
                item.event = newEvent;
                saveAndRender(section); updateCalendar();
            };

            const delBtn = document.createElement("button");
            delBtn.textContent = "삭제";
            delBtn.className = "ml-2 text-red-600";
            delBtn.onclick = () => {
                data[section].splice(index,1);
                saveAndRender(section); updateCalendar();
            };

            li.appendChild(editBtn);
            li.appendChild(delBtn);
        }

        list.appendChild(li);
    });
}

// 저장 + 렌더링
function saveAndRender(section){
    localStorage.setItem(section,JSON.stringify(data[section]));
    render(section);
}

// 등록 버튼
sections.forEach(sec=>{
    const addBtn = document.getElementById(sec+"AddBtn");
    if(addBtn){
        addBtn.onclick = ()=>{
            const dateInput = document.getElementById(sec+"Date");
            const eventInput = document.getElementById(sec+"Event");
            const date = dateInput ? dateInput.value : null;
            const event = eventInput.value;
            if(event){
                data[sec].push({date,event});
                if(dateInput) dateInput.value = "";
                eventInput.value = "";
                saveAndRender(sec);
                updateCalendar();
            }
        }
    }
});

// 섹션별 초기화 버튼 생성 (초기에는 hidden)
sections.forEach(sec=>{
    const sectionEl = document.getElementById(sec);
    const btn = document.createElement("button");
    btn.textContent = "섹션 초기화";
    btn.className = "px-3 py-1 border rounded text-red-600 ml-2 hidden"; // 초기 숨김
    btn.onclick = ()=>{
        if(confirm(`${sec} 섹션 초기화하시겠습니까?`)){
            data[sec] = [];
            saveAndRender(sec);
            updateCalendar();
        }
    };
    sectionEl.querySelector(".admin-form").appendChild(btn);
    btn.dataset.sectionInitBtn = "true"; // 관리자 로그인 시 visible
});

// 초기 렌더링
sections.forEach(sec => render(sec));

// 달력
let calendar;
window.onload = function(){
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl,{
        initialView:'dayGridMonth',
        locale:'ko',
        height:'auto',
        events:getAllEvents(),
        eventClick:function(info){alert(info.event.title);}
    });
    calendar.render();
}

// 달력 이벤트 가져오기
function getAllEvents(){
    let events = [];
    sections.forEach(sec=>{
        data[sec].forEach(item=>{
            if(item.date) events.push({title:item.event,start:item.date,backgroundColor:sectionColors[sec]});
        });
    });
    return events;
}

// 달력 업데이트
function updateCalendar(){
    if(calendar){
        calendar.removeAllEvents();
        getAllEvents().forEach(ev=>calendar.addEvent(ev));
    }
}

// 홈 버튼
document.getElementById("homeBtn").onclick = ()=>{document.getElementById("home").scrollIntoView({behavior:"smooth"});}
document.querySelectorAll(".sectionBtn").forEach(btn=>{
    btn.onclick = (e)=>{e.preventDefault(); const target=btn.getAttribute("data-target"); document.getElementById(target).scrollIntoView({behavior:"smooth"});}
});

// 관리자 로그인
document.getElementById("adminBtn").onclick = ()=>{
    const pass = document.getElementById("adminPass").value;
    if(pass === ADMIN_PASSWORD){
        isAdmin = true;
        // admin-form 보이기
        document.querySelectorAll(".admin-form").forEach(f => f.classList.remove("hidden"));
        // 섹션별 초기화 버튼 보이기
        document.querySelectorAll("button[data-section-init-btn]").forEach(b => b.classList.remove("hidden"));
        // 로그인 input/버튼 숨기기
        document.getElementById("adminBtn").classList.add("hidden");
        document.getElementById("adminPass").classList.add("hidden");
        alert("관리자 모드 활성화!");
        document.getElementById("adminPass").value = "";
        sections.forEach(sec => render(sec));
    } else {
        alert("비밀번호 틀림");
    }
}

