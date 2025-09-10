// 보문고 일정 앱 (방문자는 관람만, 관리자만 수정/등록/삭제)
// 비밀번호: 필요시 변경
const ADMIN_PASSWORD = "1234";
let isAdmin = false;

// 섹션 목록 및 섹션별 이벤트 색상
const sections = ["school","class","assignment","exam","notice"];
const sectionColors = {
  school: "#A8D0E6",
  class:  "#B8E6B8",
  assignment: "#FFE5A8",
  exam: "#FFD8A8",
  notice: "#F6A8C1"
};

// 데이터 구조: localStorage에 각 섹션 이름으로 배열 저장 [{date,event},...]
let data = {};
sections.forEach(s => {
  const raw = localStorage.getItem(s);
  data[s] = raw ? JSON.parse(raw) : [];
});

// DOMContentLoaded에 UI 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 네비 버튼 동작
  document.querySelectorAll(".nav-btn").forEach(btn=>{
    btn.addEventListener("click", e=>{
      const target = btn.getAttribute("data-target");
      document.getElementById(target).scrollIntoView({behavior:"smooth", block:"start"});
    });
  });

  // 제목 클릭 -> 홈
  document.getElementById("homeBtn").addEventListener("click", ()=> {
    document.getElementById("home").scrollIntoView({behavior:"smooth", block:"start"});
  });

  // 각 섹션의 '등록' 버튼 이벤트 바인드 (버튼은 관리자만 보지만 리스너는 미리 바인드)
  sections.forEach(sec=>{
    const addBtn = document.getElementById(sec + "AddBtn");
    if(addBtn){
      addBtn.addEventListener("click", ()=>{
        if(!isAdmin) { alert("관리자만 등록할 수 있습니다."); return; }
        const dateInput = document.getElementById(sec + "Date");
        const eventInput = document.getElementById(sec + "Event");
        const date = dateInput ? dateInput.value : null;
        const ev = eventInput.value && eventInput.value.trim();
        if(!ev){ alert("내용을 입력해주세요."); return; }
        data[sec].push({date: date || null, event: ev});
        localStorage.setItem(sec, JSON.stringify(data[sec]));
        renderSection(sec);
        updateCalendar();
        if(dateInput) dateInput.value = "";
        eventInput.value = "";
      });
    }
  });

  // 섹션별 초기화 버튼 (관리자 전용) — 이미 HTML에 추가되어 있음 (class .section-reset)
  document.querySelectorAll(".section-reset").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const sec = btn.dataset.sec;
      if(!isAdmin){ alert("관리자만 초기화할 수 있습니다."); return; }
      if(confirm(`${sec} 섹션을 초기화하시겠습니까? (복구 불가)`)){
        data[sec] = [];
        localStorage.setItem(sec, JSON.stringify(data[sec]));
        renderSection(sec);
        updateCalendar();
      }
    });
  });

  // 렌더 초기화 (목록)
  sections.forEach(renderSection);

  // FullCalendar 초기화
  initCalendar();

  // 관리자 버튼
  document.getElementById("adminBtn").addEventListener("click", ()=>{
    const pass = document.getElementById("adminPass").value;
    if(pass === ADMIN_PASSWORD){
      isAdmin = true;
      // 보이기: admin-form과 section-reset 버튼
      document.querySelectorAll(".admin-form").forEach(el=>el.classList.remove("hidden"));
      document.querySelectorAll(".section-reset").forEach(el=>el.classList.remove("hidden"));
      // 숨기기: admin 입력창 (선택)
      document.getElementById("adminPass").classList.add("hidden");
      document.getElementById("adminBtn").classList.add("hidden");
      alert("관리자 모드 활성화");
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  });
});


// 섹션 렌더링 (목록) — 방문자는 편집/삭제 버튼 없음, 관리자만 보여줌
function renderSection(sec){
  const listEl = document.getElementById(sec + "List");
  listEl.innerHTML = "";
  data[sec].forEach((item, idx)=>{
    const li = document.createElement("li");

    const left = document.createElement("div");
    left.className = "item-left";
    const title = document.createElement("div");
    title.textContent = item.event;
    title.style.fontWeight = "600";
    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = item.date ? item.date : "";
    left.appendChild(title);
    left.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    // 관리자만 수정/삭제 버튼 표시
    if(isAdmin){
      const editBtn = document.createElement("button");
      editBtn.textContent = "수정";
      editBtn.addEventListener("click", ()=>{
        const newDate = item.date ? prompt("날짜 수정", item.date) : prompt("날짜 입력(YYYY-MM-DD)", "");
        const newEvent = prompt("내용 수정", item.event);
        if(newEvent !== null && newEvent.trim() !== ""){
          item.event = newEvent.trim();
          item.date = newDate || null;
          localStorage.setItem(sec, JSON.stringify(data[sec]));
          renderSection(sec);
          updateCalendar();
        }
      });
      actions.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "삭제";
      delBtn.addEventListener("click", ()=>{
        if(confirm("정말 삭제하시겠습니까?")){
          data[sec].splice(idx,1);
          localStorage.setItem(sec, JSON.stringify(data[sec]));
          renderSection(sec);
          updateCalendar();
        }
      });
      actions.appendChild(delBtn);
    }

    li.appendChild(left);
    li.appendChild(actions);
    listEl.appendChild(li);
  });
}


// ------------------- FullCalendar -------------------
let calendar = null;
function initCalendar(){
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'ko',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay'
    },
    events: getAllEvents(),
    eventClick: function(info){
      const section = info.event.extendedProps.section || "";
      alert(`${info.event.title}\n(섹션: ${section})`);
    }
  });
  calendar.render();
}

// 앱의 모든 이벤트을 가져와 FullCalendar 포맷으로 변환
function getAllEvents(){
  const events = [];
  sections.forEach(sec=>{
    data[sec].forEach(item=>{
      if(item.date){
        events.push({
          title: item.event,
          start: item.date,
          backgroundColor: sectionColors[sec],
          borderColor: sectionColors[sec],
          extendedProps: { section: sec }
        });
      }
    });
  });
  return events;
}

// 달력 갱신
function updateCalendar(){
  if(!calendar) return;
  calendar.removeAllEvents();
  getAllEvents().forEach(ev => calendar.addEvent(ev));
}
