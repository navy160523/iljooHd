# preset
* 현대 중공업 내부 프로젝트 개발을 위한 UI-Framework Set

## 적용되는 기본 환경
* Vue Framework: `vite`, `vue3`, `pinia`, `vue-router`
* i18n: vue-i18n
* Style: SASS, SCSS, vuetify
* Rest Communication: Axios
* Chart: highchart, echart
* Grid: tuigrid, tabulator
* 주요 라이브러리 추가 예정

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

---

## 📅 변경 및 수정 이력 (2026.09.11)

### 1. SAF_D 모듈 Vue3 화면 신규 구축 및 마이그레이션 (`C:\Users\YJ\Downloads\0__260911`)
* **개요**: 다운로드 경로 내의 PUR/Vue 소스 및 쿼리/테이블 파일을 분석하여 Vue3 / Vite 표준 구조로 전수 생성 및 화면 연결
* **대상 파일**:
  * **안전수칙위반 관리 (`SAFDC0010`)**:
    * `SAFDC0010.vue` (메인 탭 컨테이너)
    * `SAFDC0010_01.vue` (등록/현황 탭) & `SAFDC0010_01Popup01.vue` (등록 팝업), `SAFDC0010_01Popup02.vue`
    * `SAFDC0010_02.vue` (조치/종결 탭) & `SAFDC0010_02Popup01.vue` (상세/조치 팝업)
    * `SAFDC0010_03.vue` (통계 탭) & `SAFDC0010_03.Popup.vue`
    * `SAFDC0010_02Tab01.vue`, `SAFDC0010_02Tab02.vue`, `SAFDC0010_02Tab03.vue` 및 해당 팝업 컴포넌트
    * 전기 분과용 컴포넌트 (`*_ELEC.vue`)
    * 팝업 서브 컴포넌트 (`SAFDC0010BikeNoPopup.vue`, `SAFDC0010CarNoPopup.vue`, `SAFDC0010VioCntPopup.vue`, `SAFDC0010VioDivPopup.vue` 등)
  * **시정통보 관리 (`SAFDC0020`)**:
    * `SAFDC0020.vue` (메인 탭 컨테이너)
    * `SAFDC0020_01.vue` (시정통보 등록/현황 탭) & `SAFDC0020_01Popup01.vue`
    * `SAFDC0020_02.vue` (시정통보 종결/승인 탭) & `SAFDC0020_02Popup01.vue`
  * **작업중지 관리 (`SAFDC0030`)**:
    * `SAFDC0030.vue` & `SAFDC0030_Popup01.vue`, `SAFDC0030_01Popup01.vue`
  * **SAFDD0010**:
    * `SAFDD0010.vue` & `SAFDD0010Popup.vue`
  * **SQL 및 쿼리 매퍼 XML**:
    * `SAFDC0010_query.xml`, `TFA1010C01.sql`, `TFA1050C01.sql`, `TFA2010C01.sql`

---

### 2. `SAFDC0010` 화면 미표시(Blank Screen) 이슈 해결
* **문제점**: `SAFDC0010` 화면 진입 시 `history.state` 또는 탭 라우터 파라미터가 비어있을 때 스크립트 에러가 발생하여 화면이 렌더링되지 않던 문제
* **수정 내용**: `history.state || {}` 널 안전 처리, `IMenuTitle` 및 그리드 바인딩 널가드 적용
* **수정 파일**: `src/pages/30_safety/SAF_D/SAFDC0010.vue` (`//2026.09.11 수정`)

---

### 3. `SAFDC0020` 발신조직 세 번째 드롭다운 "전체" 미표시 이슈 해결
* **문제점**: 시정통보 화면에서 발신조직 3단계(`SEND_ASGN_CD`) select 박스에 "전체" 기본값이 누락되어 선택 및 조회가 정상 동작하지 않던 현상
* **수정 내용**:
  * `codeList.SEND_ASGN_CD` 초기화 시 `{ ASGN_NM: "전체", ASGN_CD: "" }` 기본 항목 주입
  * `watch(searchParam.CHK_DEPT_CD)` 트리거 시 "전체" 항목 유지 및 중복 방지 로직 적용
* **수정 파일**:
  * `src/pages/30_safety/SAF_D/SAFDC0020_01.vue` (`//2026.09.11 수정`)
  * `src/pages/30_safety/SAF_D/SAFDC0020_02.vue` (`//2026.09.11 수정`)

---

### 4. Sass/SCSS 스타일 구문 에러 수정
* **문제점**: `SAFDC0010_02Popup01.vue` 스타일 블록 내 `height: calc(100vh -{ 180px);` 오타로 인한 Vite 빌드/런타임 SASS 컴파일 에러 발생
* **수정 내용**: `height: calc(100vh - 180px);` 로 올바른 계산식 문법 수정
* **수정 파일**: `src/pages/30_safety/SAF_D/SAFDC0010_02Popup01.vue` (`/* 2026.09.11 수정 */`)

---

### 5. `SAFDC0010` 단속조직 세 번째 드롭다운 "전체" 기본값 미표시 이슈 해결
* **문제점**: 안전수칙위반 등록/현황 및 조치 탭에서 단속조직 3단계(`dansokDeptCd`) 드롭다운에 "전체" 옵션이 default로 표시되지 않던 현상
* **수정 내용**:
  * `dansokDeptCd` 초기화 시 `{ DEPT_NM: "전체", DEPT_CD: "" }` 항목 추가
  * 발신 사업본부/부서 변경 시 트리거되는 `watch` 내부에서도 "전체" 옵션 유지 로직 적용
* **수정 파일**:
  * `src/pages/30_safety/SAF_D/SAFDC0010_01.vue` (`//2026.09.11 수정`)
  * `src/pages/30_safety/SAF_D/SAFDC0010_02.vue` (`//2026.09.11 수정`)

---

### 6. `SAFDC0020` 시정통보 종결 처리 팝업 "6. 종결자 정보" 등록 및 저장 로직 구현
* **요구사항**: 시정통보 종결 처리 탭의 상세/등록 팝업에 `⑥ 종결자정보` UI 영역을 추가하고 저장 시 종결자 데이터가 정상 반영되도록 수정
* **수정 내용**:
  * **종결자 정보 UI 구성**:
    * `종결자성명` (`CLOSE_EMP_NM`): 돋보기 아이콘 클릭 시 인원 검색 팝업(`EmpPopup`) 오픈
    * `사번` (`CLOSE_EMP_NO`): 자동 입력 및 읽기 전용
    * `직위` (`CLOSE_JOB_TIT_NM`): 자동 입력 및 읽기 전용
    * `소속` (`CLOSE_ASGN_NM`): 자동 입력 및 읽기 전용
    * `전화번호` (`CLOSE_TEL_NO`): 자동 입력 및 읽기 전용
  * **데이터 바인딩 및 초기화**:
    * 그리드 행 더블클릭(`openPopup2`) 시 전달받은 종결자 정보(`CLOSE_EMP_NM`, `CLOSE_EMP_NO`, `CLOSE_JOB_TIT_NM`, `CLOSE_ASGN_NM`, `CLOSE_ASGN_CD`, `CLOSE_DEPT_CD`, `CLOSE_TEL_NO`, `CLOSE_DT`) 매핑
    * 팝업 초기화(`initField`) 시 종결자 필드 초기화
  * **저장 로직 (`saveNotiData`)**:
    * `SAFDC0010_SAVE04` 호출 시 종결자 파라미터 전송 로직 구성
  * **팝업 내부 승인신청/승인신청취소 핸들러 연동**
  * **탭 2 팝업 컴포넌트 연결**:
    * `SAFDC0020_02.vue`에서 `SAFDC0020_02Popup01` 컴포넌트 import 및 신규 등록/셀 더블클릭 상세조회 바인딩
  * **목(Mock) API 추가**:
    * `commonApi.js` 내 `SAFDC0010_CANCEL01` 응답 핸들러 추가
* **수정 파일**:
  * `src/pages/30_safety/SAF_D/SAFDC0020_02Popup01.vue` (`//2026.09.11 수정`)
  * `src/pages/30_safety/SAF_D/SAFDC0020_01Popup01.vue` (`//2026.09.11 수정`)
  * `src/pages/30_safety/SAF_D/SAFDC0020_02.vue` (`//2026.09.11 수정`)
  * `src/@hiway/api/commonApi.js` (`//2026.09.11 수정`)

---

### 7. 소스코드 수정 주석 명시 규정 준수
* 2026.09.11에 수정된 모든 Vue 및 JS/SCSS 코드에 `//2026.09.11 수정` (또는 `/* 2026.09.11 수정 */`) 주석을 작성하여 변경 사항을 명시함
