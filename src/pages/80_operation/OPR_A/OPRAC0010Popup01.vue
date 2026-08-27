<!--
  화면명 : 안전요원 다른일자로 복사
  화면개요 : 해당 일자에 있는 안전요원들째로 다른 일자로 복사
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const daysMonth = ref(0)
const weekDays = reactive(['일', '월', '화', '수', '목', '금', '토'])
const blanks = ref(null)
const currentYear = ref(0)
const currentMonth = ref(0)
const tabNumber = ref(0)
const grdMain = ref(null)

const selectedDays = reactive({
  select: [],
})
const calendarTitle = reactive({ 
  title: '',
})

// 일자별 
const cntMan = reactive({
  cnt: {},
})

const codeList = reactive({
  GWA_CD: [],
  TEAM_CD: [],
})

// combobox 리스트 조회
const getCode = () => {
  Promise.all([
       commonSearchApi({ queryId : 'OPRAC0010_SEARCH_04', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV:'Y' } }), // 부서
       commonSearchApi({ queryId : 'OPRAC0010_SEARCH_05', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: '', DEPT_CD: '', USE_DIV:'Y' } }), // 부서
    ]).then(res => {
      codeList.GWA_CD = res[0].ORESULT_CUR
      codeList.TEAM_CD = res[1].ORESULT_CUR
  })  
}

/* 안전요원 조회 조건 */
const searchParams = reactive([
  {
    CMPNY_DIV: userStore.cmpnyDiv,
    FROM_WK_DT: '',
    TO_WK_DT: '',
    USER_ID: userStore.userId,
    REL_DEPT_CD: '',
    REL_GWA_CD: '',
    REL_TEAM_CD: '',
    NIGHT_YN : ''
  }
])

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
  keys: [],
  fields: [
    { fieldName: 'TO_WK_DT', dataType: 'text', header: { text: t('복사적용일자') }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'FROM_WK_DT', dataType: 'text', header: { text: t('기분일자') }, visible: false },
    { fieldName: 'USER_ID', dataType: 'text', header: { text: t('사용자') }, visible: false },
    { fieldName: 'REL_DEPT_CD', dataType: 'text', header: { text: t('안전부') }, visible: false },
    { fieldName: 'REL_GWA_CD', dataType: 'text', header: { text: t('안전과') }, visible: false },
    { fieldName: 'REL_TEAM_CD', dataType: 'text', header: { text: t('안전팀') }, visible: false },
    { fieldName: 'NIGHT_YN', dataType: 'text', header: { text: t('NIGHT_YN') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = (param, tab) => {
  selectedDays.select = []
  grdMain.value.getDataProvider().setRows([])

  // 몇 번 탭인지 저장(장소인지, 호선/프로젝트인지)
  tabNumber.value = tab

  // 안전과,안전팀 목록 가져오기
  getCode()

  //날짜설정
  searchParams[0].FROM_WK_DT = param.TMP_WK_DT
  searchParams[0].REL_GWA_CD = param.REL_GWA_CD
  searchParams[0].REL_TEAM_CD = param.REL_TEAM_CD
  searchParams[0].NIGHT_YN = param.NIGHT_YN
  currentYear.value = param.TMP_WK_DT.split('-')[0]
  currentMonth.value = param.TMP_WK_DT.split('-')[1]

  // 달력 설정
  setCalendar()
  dialog.value = true
}

const setCalendar = () => {
  let query = ''
  let teamCd = searchParams[0].REL_TEAM_CD 
  if(tabNumber.value == 1) query = 'OPRAC0010_SEARCH_07'
  else query = 'OPRAC0010_SEARCH_09'

  daysMonth.value = new Date(currentYear.value, currentMonth.value, 0).getDate()
  currentMonth.value = parseInt(currentMonth.value, 10)
  if(currentMonth.value < 10) currentMonth.value = '0' + currentMonth.value
  calendarTitle.title = '' + currentYear.value + ' - ' + currentMonth.value

  if(searchParams[0].REL_TEAM_CD == null || searchParams[0].REL_TEAM_CD == '') teamCd = searchParams[0].REL_GWA_CD 
  Promise.all([
       commonSearchApi({ queryId : query, param : { WK_DT: currentYear.value + currentMonth.value + '01', REL_TEAM_CD: teamCd } }), // 부서
    ]).then(res => {
      cntMan.cnt = res[0].ORESULT_CUR[0]
  })  
  blanks.value = new Array(new Date(currentYear.value, currentMonth.value - 1, 1).getDay()).fill('');
  
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain}])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setConfirmMessage(searchParams[0].FROM_WK_DT + '일자에 있는 데이터를 저장할 일자들로 복사하시겠습니까?')
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
    
  } else if (btn.id === 'btnClose') {
    closePopup()
  } else if (btn.id === 'btnPrev') {
    if (currentMonth.value == 1) {
      currentYear.value--;
      currentMonth.value = 12;
    } else {
      currentMonth.value--;
    }
    setCalendar()
  } else if (btn.id === 'btnNext') {
    if (currentMonth.value === 12) {
      currentYear.value++;
      currentMonth.value = 1;
    } else {
      currentMonth.value++;
    }
    setCalendar()
  }
}

/* ********** 저장전 체크 ********** */
const beforeSave = () => {
  let rows = grdMain.value.getDataProvider().getRowCount()
  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if (data.FROM_WK_DT == '') {
      return Message.warn('기준일자를 확인해 주십시오.')
    } else if (data.TO_WK_DT == '') {
      return Message.warn('기준일자와 복사적용일자가 같을 수 없습니다.')
    } else if (data.FROM_WK_DT === data.TO_WK_DT) {
      return Message.warn('일자를 확인해 주십시오.')
    } 
  }
  return true
}

/* ********** 저장 ********** */
const saveData = () => {
  let saveParams = []
  let rows = grdMain.value.getDataProvider().getRowCount()
  
  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.USER_ID = userStore.userId // USER_ID
    data.FROM_WK_DT = data.FROM_WK_DT.replaceAll('-','')
    data.TO_WK_DT = data.TO_WK_DT.replaceAll('-','')
    if((data.REL_GWA_CD != null && data.REL_GWA_CD != '') && (data.REL_TEAM_CD == null || data.REL_TEAM_CD == '')) {
      data.REL_TEAM_CD = data.REL_GWA_CD
    }
    saveParams.push(data) 
  }
  // 탭1,탭2일시 쿼리가 달라진다.
  if(tabNumber.value == 1) return commonExecuteApi({ queryId : 'OPRAC0010_SAVE_02', list: saveParams })
  else return commonExecuteApi({ queryId : 'OPRAC0010_SAVE_06', list: saveParams })
}

// 저장 후 작업
const afterSaveData = () => { 
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}

/* ********** 닫기 ********** */
const closePopup = () => {
  //searchSubData.value()
  emit('after-search')
  dialog.value = false
}

const clickCalendar = (day) => {
  if(day < 10) day = '0' + day
  const selectDate = calendarTitle.title.replaceAll(' ','') + '-' + day
  const index = selectedDays.select.indexOf(selectDate)
  let grdData = []

  // 기준일자와 같을 시 return
  if(selectDate == searchParams[0].FROM_WK_DT) return

  if(index !== -1) {
    selectedDays.select.splice(index,1)
  } else {
    selectedDays.select.push(selectDate)
  }
  selectedDays.select.sort()

  grdMain.value.getDataProvider().setRows([])
  for(var d of selectedDays.select) {
    grdData.push({
      TO_WK_DT: d,
      CMPNY_DIV: userStore.cmpnyDiv,
      FROM_WK_DT: searchParams[0].FROM_WK_DT,
      REL_DEPT_CD: searchParams[0].REL_DEPT_CD,
      REL_GWA_CD: searchParams[0].REL_GWA_CD,
      REL_TEAM_CD: searchParams[0].REL_TEAM_CD,
      NIGHT_YN: searchParams[0].NIGHT_YN
    })
  }
  grdMain.value.getDataProvider().setRows(grdData)
}

// 선택한 일자일 시
const isSelected = (day) => {
  if(day < 10) day = '0' + day
  if(selectedDays.select == null) return false
  for(var d of selectedDays.select) {
    if(calendarTitle.title.replaceAll(' ','') + '-' + day === d) {
      return true
    }
  }
  return false
}

// 이미 안전요원이 다 배치된 경우
const isComplete = (day) => {
  if(cntMan.cnt == null) return false
  if(cntMan.cnt[day] == 0) return true
  return false
}

// 기준날짜
const isNow = (day) => {
  var dt = searchParams[0].FROM_WK_DT.split('-')
  if(currentYear.value != dt[0]) return false
  else if(currentMonth.value != dt[1]) return false
  else if(day != parseInt(dt[2])) return false
  return true
}

watch(() => searchParams[0].FROM_WK_DT, (newValue, oldValue) => {
  for(var i = 0; i < grdMain.value.getDataProvider().getRowCount(); i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(i)

    if(newValue == data.TO_WK_DT) {
      grdMain.value.getDataProvider().removeRow(i)
      selectedDays.select.splice(selectedDays.select.indexOf(newValue),1)
      break
    }
  }
})

defineExpose({
  openPopup,
})

onMounted(() => {
  
})

</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    height="790"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>다른일자로 복사</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4">
        <v-sheet class="searchArea d-flex flex-column mb-2">
          <div class="d-flex">
            <i-select
              v-model="searchParams[0].REL_GWA_CD"
              :label="$t('안전과')"
              :items="codeList.GWA_CD"
              :disabled=true
              label-width="50px"
              width="200px"
              item-value="ASGN_CD"
              item-title="ASGN_NM" 
            />
            <i-select
              v-model="searchParams[0].REL_TEAM_CD"
              :label="$t('안전팀')"
              :items="codeList.TEAM_CD"
              :disabled=true
              label-width="50px"
              width="200px"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
            />
            <i-input
              :label="$t('기준일자')"
              v-model="searchParams[0].FROM_WK_DT"
              label-width="50px"
              type="Date"
              width="200px"
              margin="10px"
            />
            <div class="legend ml-2 align-center d-flex">
              <div class="legend-complete mr-1"></div>
              <div> : 안전요원 배정 완료</div>
              <div class="legend-wk-dt mr-1 ml-2"></div>
              <div> : 기준일자</div>
              <div class="legend-selected mr-1 ml-2"></div>
              <div> : 복사적용일자</div>
            </div>
          </div>
        </v-sheet>
      </div>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area" style="width:65%; height:560px;">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <div>
                
                <IGridTitle 
                  ref="menuTitle"
                  :title="$t(calendarTitle.title)"
                  :use-permission="false"
                  :button-list="['btnPrev', 'btnNext']"
                  @click-button="onButtonsClick"
                />
              </div>
              <div class="calendar">
                <div class="calendar-header" v-for="day in weekDays" :key="day">{{ day }}</div>
                <div class="calendar-day" v-for="blank in blanks" :key="'blank-' + blank"></div>
                <div class="calendar-day" :class="{ selected: isSelected(day), now: isNow(day) }" @click="clickCalendar(day)" v-for="day in daysMonth" :key="day">
                  <div :class="{ completed: isComplete(day)}">
                    {{ day }}
                  </div>
                </div>
              </div> 
        
            </v-sheet>
          </div>
        </v-card-text>
        <v-card-text class="pa-4 pt-0 content-area" style="width:35%">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 519px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  .calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
  }
  .calendar-day, .calendar-header {
    padding: 10px;
    text-align: center;
    border: 1px solid #ddd;
    font-size: 1.3rem;
    height: 4rem;
    line-height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(33, 33, 33, 0.914);
  }
  .calendar-header {
    font-weight: bold;
    background-color: #f0f0f0;
  }
  .selected {
    background-color: #cad7f9d8;
  }
  .now {
    background-color: rgba(255, 182, 45, 0.702);
  }
  .completed {
    width: 60%;
    height: 100%;
    border-radius: 50%;
    background-color: #a1f19abf;
  }
  .legend {
    font-size: 14px;
    margin-left: auto !important;
  }
  .legend-complete {
    width: 25px;
    height: 25px;
    border-radius: 50%; 
    background-color: #a1f19abf;
  }
  .legend-wk-dt {
    width: 25px;
    height: 25px;
    background-color: rgba(255, 182, 45, 0.702);
  }
  .legend-selected {
    width: 25px;
    height: 25px;
    background-color: #cad7f9d8;
;
  }
</style>
