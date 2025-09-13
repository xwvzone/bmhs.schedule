// 보문고 일정 앱 (방문자는 관람만, 관리자만 수정/등록/삭제)
// 비밀번호: 필요시 변경
const ADMIN_PASSWORD = "1234";
let isAdmin = false;
let currentToast = null;

// 섹션 목록 및 섹션별 아이콘
const sections = ["school", "class", "assignment", "exam", "notice"];
const sectionIcons = {
  school: "🏫",
  class: "📚",
  assignment: "📝",
  exam: "📋",
  notice: "📢",
};
const sectionNames = {
  school: "학교 일정",
  class: "학급 일정",
  assignment: "수행평가",
  exam: "시험 일정",
  notice: "공지사항",
};

// 데이터 구조: localStorage에 각 섹션 이름으로 배열 저장 [{date,event},...]
let data = {};
sections.forEach((s) => {
  const raw = localStorage.getItem(s);
  data[s] = raw ? JSON.parse(raw) : [];
});

// DOMContentLoaded에 UI 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 네비 버튼 동작
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = btn.getAttribute("data-target");
      document
        .getElementById(target)
        .scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // 제목 클릭 -> 홈
  document.getElementById("homeBtn").addEventListener("click", () => {
    document
      .getElementById("home")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // 각 섹션의 '등록' 버튼 이벤트 바인드 (버튼은 관리자만 보지만 리스너는 미리 바인드)
  sections.forEach((sec) => {
    const addBtn = document.getElementById(sec + "AddBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        if (!isAdmin) {
          alert("관리자만 등록할 수 있습니다.");
          return;
        }
        const dateInput = document.getElementById(sec + "Date");
        const eventInput = document.getElementById(sec + "Event");
        const date = dateInput ? dateInput.value : null;
        const ev = eventInput.value && eventInput.value.trim();

        // 유효성 검증
        if (!ev) {
          showToast("내용을 입력해주세요.", "warning");
          eventInput.focus();
          return;
        }

        if (dateInput && !date) {
          showToast("날짜를 선택해주세요.", "warning");
          dateInput.focus();
          return;
        }

        data[sec].push({ date: date || null, event: ev });
        localStorage.setItem(sec, JSON.stringify(data[sec]));
        renderSection(sec);
        updateCalendar();

        // 성공 피드백
        showToast(`${sectionNames[sec]}에 일정이 추가되었습니다.`, "success");

        if (dateInput) dateInput.value = "";
        eventInput.value = "";
      });
    }
  });

  // 섹션별 초기화 버튼 (관리자 전용) — 이미 HTML에 추가되어 있음 (class .section-reset)
  document.querySelectorAll(".section-reset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sec = btn.dataset.sec;
      if (!isAdmin) {
        showToast("관리자만 초기화할 수 있습니다.", "error");
        return;
      }
      if (showConfirm(`${sectionNames[sec]} 전체를 삭제하시겠습니까?`, "이 작업은 되돌릴 수 없습니다.")) {
        data[sec] = [];
        localStorage.setItem(sec, JSON.stringify(data[sec]));
        renderSection(sec);
        updateCalendar();
        showToast(`${sectionNames[sec]}이 초기화되었습니다.`, "success");
      }
    });
  });

  // 렌더 초기화 (목록)
  sections.forEach(renderSection);

  // FullCalendar 초기화
  initCalendar();

  // 관리자 버튼
  document.getElementById("adminBtn").addEventListener("click", () => {
    const pass = document.getElementById("adminPass").value;
    if (!pass) {
      showToast("비밀번호를 입력해주세요.", "warning");
      document.getElementById("adminPass").focus();
      return;
    }

    if (pass === ADMIN_PASSWORD) {
      isAdmin = true;
      // 보이기: admin-form과 section-reset 버튼
      document
        .querySelectorAll(".admin-form")
        .forEach((el) => {
          el.classList.remove("admin-inactive");
          el.classList.add("admin-active");
        });
      document
        .querySelectorAll(".section-reset")
        .forEach((el) => el.classList.remove("hidden"));
      // 숨기기: admin 입력창
      document.getElementById("adminPass").classList.add("hidden");
      document.getElementById("adminBtn").classList.add("hidden");

      // 환영 메시지
      showToast("관리자 모드가 활성화되었습니다.", "success");

      // 모든 섹션 다시 렌더링
      sections.forEach(renderSection);
    } else {
      showToast("비밀번호가 틀렸습니다.", "error");
      document.getElementById("adminPass").value = "";
      document.getElementById("adminPass").focus();
    }
  });

  // Enter 키로 관리자 로그인
  document.getElementById("adminPass").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("adminBtn").click();
    }
  });
});

// 섹션 렌더링 (목록) — 방문자는 편집/삭제 버튼 없음, 관리자만 보여줌
function renderSection(sec) {
  const listEl = document.getElementById(sec + "List");
  listEl.innerHTML = "";
  data[sec].forEach((item, idx) => {
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
    if (isAdmin) {
      const editBtn = document.createElement("button");
      editBtn.textContent = "수정";
      editBtn.className = "edit-btn";
      editBtn.addEventListener("click", () => {
        showEditModal(sec, item);
      });
      actions.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "삭제";
      delBtn.className = "delete-btn";
      delBtn.addEventListener("click", () => {
        if (showConfirm("이 일정을 삭제하시겠습니까?", item.event)) {
          data[sec].splice(idx, 1);
          localStorage.setItem(sec, JSON.stringify(data[sec]));
          renderSection(sec);
          updateCalendar();
          showToast("일정이 삭제되었습니다.", "success");
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
function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ko",
    height: "auto",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,dayGridWeek,dayGridDay",
    },
    events: getAllEvents(),
    eventClick: function (info) {
      const section = info.event.extendedProps.section || "";
      const sectionName = sectionNames[section] || section;
      showEventDetail(info.event.title, sectionName, info.event.start);
    },
  });
  calendar.render();
}

// 앱의 모든 이벤트을 가져와 FullCalendar 포맷으로 변홁
// 색상은 CSS에서 처리
function getAllEvents() {
  const events = [];
  sections.forEach((sec) => {
    data[sec].forEach((item) => {
      if (item.date) {
        events.push({
          title: `${sectionIcons[sec]} ${item.event}`,
          start: item.date,
          classNames: [sec],
          extendedProps: { section: sec },
        });
      }
    });
  });
  return events;
}

// 달력 갱신
function updateCalendar() {
  if (!calendar) return;
  calendar.removeAllEvents();
  getAllEvents().forEach((ev) => calendar.addEvent(ev));
}

// Toast 메시지 표시
function showToast(message, type = "info") {
  // 기존 toast 제거
  if (currentToast) {
    currentToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${getToastIcon(type)}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;

  document.body.appendChild(toast);
  currentToast = toast;

  // 애니메이션
  setTimeout(() => toast.classList.add("show"), 10);

  // 자동 제거
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (currentToast === toast) {
        toast.remove();
        currentToast = null;
      }
    }, 300);
  }, 3000);
}

function getToastIcon(type) {
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ"
  };
  return icons[type] || icons.info;
}

// Custom confirm dialog
function showConfirm(title, message) {
  return confirm(`${title}\n\n${message}`);
}

// 이벤트 상세 보기
function showEventDetail(title, section, date) {
  const dateStr = date ? new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }) : '';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <p><strong>분류:</strong> ${section}</p>
        ${dateStr ? `<p><strong>날짜:</strong> ${dateStr}</p>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);

  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  });
}

// 편집 모달 (idx 매개변수 제거 - 사용하지 않음)
function showEditModal(sec, item) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>일정 수정</h3>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>날짜</label>
          <input type="date" id="editDate" value="${item.date || ''}" />
        </div>
        <div class="form-group">
          <label>내용</label>
          <input type="text" id="editEvent" value="${item.event}" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel">취소</button>
          <button class="btn-save">저장</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);

  const closeModal = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('.btn-cancel').addEventListener('click', closeModal);

  modal.querySelector('.btn-save').addEventListener('click', () => {
    const newDate = modal.querySelector('#editDate').value;
    const newEvent = modal.querySelector('#editEvent').value.trim();

    if (!newEvent) {
      showToast('내용을 입력해주세요.', 'warning');
      return;
    }

    item.date = newDate || null;
    item.event = newEvent;
    localStorage.setItem(sec, JSON.stringify(data[sec]));
    renderSection(sec);
    updateCalendar();
    showToast('일정이 수정되었습니다.', 'success');
    closeModal();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}
