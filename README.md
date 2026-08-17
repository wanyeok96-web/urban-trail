# URBAN TRAIL · Metro Atlas

수업용 지리 보드게임. 서버·로그인 없이 브라우저에서 바로 실행됩니다.

## 바로 실행

1. 이 폴더의 `index.html`을 Chrome 또는 Edge로 엽니다.
2. 또는 개발용 서버:

```bash
node .claude/serve.js
```

브라우저에서 http://localhost:5599 로 접속합니다.

## 수업에서 쓰기

- 태블릿 1대 = 1팀 (또는 혼자 하기)
- 홈 → **어반 런 시작** → 여행 → **제출용 PDF 저장**
- 선생님 안내는 홈 → **선생님용**

기록은 그 기기의 브라우저에만 저장되며 외부로 전송되지 않습니다.

## GitHub Pages로 배포

저장소 설정 → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`  
몇 분 후 `https://wanyeok96-web.github.io/urban-trail/` 에서 열립니다.

## 구성

| 파일 | 역할 |
|------|------|
| `index.html` | 화면 구조 |
| `style.css` | 디자인 |
| `script.js` | 게임 엔진 |
| `data.js` | 도시 48개 데이터 |
| `world.js` | 세계지도 |
| `fonts/` | Pretendard |
| `docs/teacher-guide.html` | 선생님 안내(인쇄용) |
