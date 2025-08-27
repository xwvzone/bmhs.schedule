let isAdmin=false;
const ADMIN_PASSWORD="1234";
const sections=["school","class","assignment","exam","notice"];
const sectionColors={school:"#A8D0E6",assignment:"#FFE5A8",class:"#B8E6B8",exam:"#FFD8A8",notice:"#F6A8C1"};
let data={};

// 로컬스토리지 불러오기
sections.forEach(sec=>{
    let stored = JSON.parse(localStorage.getItem(sec));
    data[sec]=Array.isArray(stored)?stored:[];
});

// 렌더링
function render(section){
    const list=document.getElementById(section+"List");
    list.innerHTML="";
    data[section].forEach((item,index)=>{
        const li=document.createElement("li");
        li.textContent=item.date?`${item.date} - ${item.event}`:item.event;
        // 방문자도 등록/삭제 가능
        const delBtn=document.createElement("button");
        delBtn.textContent="삭제";
        delBtn.onclick=()=>{
            data[section].splice(index,1);
            saveAndRender(section);
            updateCalendar();
        };
        li.appendChild(delBtn);

        if(isAdmin){
            const editBtn=document.createElement("button");
            editBtn.textContent="수정";
            editBtn.onclick=()=>{
                const newDate=item.date?prompt("날짜 수정",item.date):null;
                const newEvent=prompt("내용 수정",item.event);
                if(item.date)item.date=newDate;
                item.event=newEvent;
                saveAndRender(section);
                updateCalendar();
            };
            li.appendChild(editBtn);
        }
        list.appendChild(li);
    });
}

// 저장 + 렌더
function saveAndRender(section){
    localStorage.setItem(section,JSON.stringify(data[section]));
    render(section);
}

// 등록 버튼
sections.forEach(sec=>{
    const addBtn=document.getElementById(sec+"AddBtn");
    if(addBtn){
        addBtn.onclick=()=>{
            const dateInput=document.getElementById(sec+"Date");
            const eventInput=document.getElementById(sec+"Event");
            const date=dateInput?dateInput.value:null;
            const event=eventInput.value;
            if(event){
                data[sec].push({date,event});
                if(dateInput)dateInput.value="";
                eventInput.value="";
                saveAndRender(sec);
                updateCalendar();
            }
        }
    }
});

// 초기화 버튼 (관리자 모드만)
sections.forEach(sec=>{
    const sectionEl=document.getElementById(sec);
    const btn=document.createElement("button");
    btn.textContent="섹션 초기화";
    btn.className="px-3 py-1 border rounded text-red-600 ml-2 hidden";
    btn.onclick=()=>{
        if(confirm(`${sec} 섹션 초기화하시겠습니까?`)){
            data[sec]=[];
            saveAndRender(sec);
            updateCalendar();
        }
    };
    sectionEl.querySelector(".admin-form").appendChild(btn);
    btn.dataset.sectionInitBtn="true";
});

sections.forEach(sec=>render(sec));

// 달력
let calendar;
window.onload=function(){
    const calendarEl=document.getElementById('calendar');
    calendar=new FullCalendar.Calendar(calendarEl,{
        initialView:'dayGridMonth',
        locale:'ko',
        height:'auto',
        events:getAllEvents(),
        eventClick:function(info){alert(info.event.title);}
    });
    calendar.render();
}

function getAllEvents(){
    let events=[];
    sections.forEach(sec=>{
        data[sec].forEach(item=>{
            if(item.date)events.push({title:item.event,start:item.date,backgroundColor:sectionColors[sec]});
        });
    });
    return events;
}

function updateCalendar(){
    if(calendar){calendar.removeAllEvents(); getAllEvents().forEach(ev=>calendar.addEvent(ev));}
}

// 홈 버튼
document.getElementById("homeBtn").onclick=()=>{document.getElementById("home").scrollIntoView({behavior:"smooth"});}

// 관리자 로그인
document.getElementById("adminBtn").onclick=()=>{
    const pass=document.getElementById("adminPass").value;
    if(pass===ADMIN_PASSWORD){
        isAdmin=true;
        document.querySelectorAll(".admin-form").forEach(f=>f.classList.remove("hidden"));
        document.querySelectorAll("button[data-section-init-btn]").forEach(b=>b.classList.remove("hidden"));
        document.getElementById("adminBtn").classList.add("hidden");
        document.getElementById("adminPass").classList.add("hidden");
        alert("관리자 모드 활성화!");
        document.getElementById("adminPass").value="";
        sections.forEach(sec=>render(sec));
    } else {alert("비밀번호 틀림");}
}

