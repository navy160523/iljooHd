<!--
  화면명 : 업무상질병 사업주조사서
  화면개요 : 업무상질병 사업주 조사서
-->
<script setup>
import { ref, getCurrentInstance } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonSearchApi, commonRequest } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'

const vm = getCurrentInstance().proxy //다이얼로그관련
const menuTitle = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(['btnPrev', 'btnNext', 'btnCloseClick','btnUpdate'])
const grd1 = ref(null)
const grd2 = ref(null)
const grd3 = ref(null)
const scrollBox = ref(null)

const codeList = reactive({
  OVERTIME: [
    { COD: '17:00 ~ 18:00' },
    { COD: '17:00 ~ 19:00' },
    { COD: '17:00 ~ 20:00' },
    { COD: '17:00 ~ 21:00' },
    { COD: '17:00 ~ 22:00' },
  ],
  SPECIAL: [
    { COD: '08:00 ~ 12:00' },
    { COD: '08:00 ~ 17:00' },
    { COD: '08:00 ~ 18:00' },
  ],
  DAY: [
    { COD: '08:00 ~ 17:00' },
  ],
  NIGHT: [
    { COD: '20:00 ~ 05:00' },
    { COD: '20:00 ~ 06:00' },
    { COD: '20:00 ~ 07:00' },
  ]
})

const props = defineProps({ 
  searchParams: Object,
}) // props 객체를 직접 사용


//그리드 속성셋팅 
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }, },
  keys : [], 
  fields : [ 
    { fieldName: 'DEPTNAME', width: '80', dataType: 'text', header: { text: t('소속') }},
    { fieldName: 'START_DATE', width: '60', dataType: 'text', header: { text: t('시작일') }},
    { fieldName: 'END_DATE', width: '60', dataType: 'text', header: { text: t('종료일') }},
    { fieldName: 'TOTAL_DATE', width: '40', dataType: 'text', header: { text: t('기간') }},
    { fieldName: 'JOBCODE_NM', width: '80', dataType: 'text', header: { text: t('수행업무') }},
    
    // 안보이는거
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') },visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'IDX', dataType: 'text', header: { text: t('인덱스') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 속성셋팅 
const grd2Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: true }, },
  keys : [], 
  fields : [ 
    { fieldName: 'REST_GUBUN', width: '60', dataType: 'text', editable: false, header: { text: t('구분') }},
    { fieldName: 'DIAGNOSIS_DATE', width: '60', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', styleName:'editable_column', header: { text: t('재해일') },
      'editor': {
        'type': 'date',
        'commitOnSelect': true,
        'mask': {
          'editMask': '9999-99-99',
          'placeHolder':'yyyy-MM-dd', 
          'includedFormat': true
        }
      },
    },
    { fieldName: 'START_DATE', width: '60', dataType: 'text', editable: false, header: { text: t('시작일') }},
    { fieldName: 'END_DATE', width: '60', dataType: 'text', editable: false, header: { text: t('종료일') }},
    { fieldName: 'TOTAL_DATE', width: '40', dataType: 'number', editable: false, numberFormat: '#,###', styleName:'right-column', header: { text: t('요양일수') }},
    { fieldName: 'NOTE', width: '150', dataType: 'text', editable: false, styleName: 'left-column', header: { text: t('상해 부위') }},
    
    // 안보이는거
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') },visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'IDX', dataType: 'text', header: { text: t('인덱스') },visible: false, },
  ],
  columns : [],
})

grd2Props.columns = grd2Props.fields

//그리드 속성셋팅 
const grd3Props = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: true }, },
  keys : [], 
  fields : [ 
    { fieldName: 'REST_GUBUN', width: '80', dataType: 'text', editable: false, header: { text: t('구분') }},
    { fieldName: 'START_DATE', width: '60', dataType: 'text', editable: false, header: { text: t('휴직일') }},
    { fieldName: 'END_DATE', width: '60', dataType: 'text', editable: false, header: { text: t('종료일') }},
    { fieldName: 'TOTAL_DATE', width: '40', dataType: 'number', editable: false, numberFormat: '#,###', styleName:'right-column', header: { text: t('휴직일수') }},
    { fieldName: 'NOTE', width: '160', dataType: 'text', styleName:'editable_column left-column', editor: { maxLength: 250 }, header: { text: t('사유') }},
    
    // 안보이는거
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') },visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'IDX', dataType: 'text', header: { text: t('인덱스') },visible: false, },
  ],
  columns : [],
})

grd3Props.columns = grd3Props.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    emit('btnCloseClick')
  } else if (btn.id === 'btnPrev') {
    emit('btnPrev')
  } else if (btn.id === 'btnNext') {
    emit('btnNext')
  } else if (btn.id === 'btnUpdate') {
    emit('btnUpdate')
  } 
}

// 근무일수 계산
const getWorkDate = computed(() => {
  const joinDate = dayjs(props.searchParams.COM_ENT_DATE, 'YYYY-MM-DD') // 입사일
  const resignDate = dayjs(props.searchParams.RETI_DATE || dayjs()) // 퇴직/휴직일
  // 총 근무 연수 계산
  const years = resignDate.diff(joinDate, 'year')
  // 남은 개월 수 계산
  const months = resignDate.diff(joinDate.add(years, 'year'), 'month')
  // 결과 문자열 반환
  return `${years}년 ${months}개월`
})

// 만 나이 구하기
const getAge = computed(() => {
  // 생년월일을 dayjs 객체로 생성
  const birthDate = dayjs(props.searchParams.BIRTH_DAY, 'YYYY-MM-DD')
  // 현재 날짜를 dayjs 객체로 생성
  const currentDate = dayjs()
  // 전체 연도 차이 계산
  const fullYearDifference = currentDate.diff(birthDate, 'year')
  // 올해 생일 날짜 계산
  const thisYearsBirthday = birthDate.add(fullYearDifference, 'year')
  // 생일이 지났는지 여부 확인
  const hasBirthdayPassed = !currentDate.isBefore(thisYearsBirthday)
  // 실제 나이 계산
  return hasBirthdayPassed ? fullYearDifference : fullYearDifference - 1
})

const getData = () => {
  return props.searchParams 
}

const getHistoryData = () => {
  let grd2Data = []
  for(let dt of grd2.value.getDataProvider().getJsonRows(0,-1)) {
    dt.DIAGNOSIS_DATE = dayjs(dt.DIAGNOSIS_DATE).format('YYYY-MM-DD')
    grd2Data.push(dt)
  }
  return {
    grdData1: grd1.value.getDataProvider().getJsonRows(0,-1),
    grdData2: grd2Data,
    grdData3: grd3.value.getDataProvider().getJsonRows(0,-1)
  }
}


const getGridData = () => {
  grd1.value.getGridView().setRowIndicator({ visible: false })
  grd2.value.getGridView().setRowIndicator({ visible: false })
  grd3.value.getGridView().setRowIndicator({ visible: false })
  

  Promise.all([
    commonSearchApi({ queryId: 'HLTJB0010_SEARCH_10', param: { CMPNY_DIV: props.searchParams.CMPNY_DIV, EMP_NO: props.searchParams.EMP_NO } }),
    commonSearchApi({ queryId: 'HLTJB0010_SEARCH_08', param: { CMPNY_DIV: props.searchParams.CMPNY_DIV, EMP_NO: props.searchParams.EMP_NO } }),
    commonSearchApi({ queryId: 'HLTJB0010_SEARCH_11', param: { CMPNY_DIV: props.searchParams.CMPNY_DIV, EMP_NO: props.searchParams.EMP_NO } }),
  ]).then((res) => {
    if(!isEmpty(res[0].ORESULT_CUR)) {
      grd1.value.getDataProvider().setRows(res[0].ORESULT_CUR)
    }
    if(!isEmpty(res[1].ORESULT_CUR)) {
      grd2.value.getDataProvider().setRows(res[1].ORESULT_CUR)
    }
    if(!isEmpty(res[2].ORESULT_CUR)) {
      grd3.value.getDataProvider().setRows(res[2].ORESULT_CUR)
    }

    // 저장된 인사발령정보가 없다는 뜻으로 조회
    if(isEmpty(res[0].ORESULT_CUR)) {
      commonRequest('/hse/health/HLTJB0010_GET_02', { EMP_NO: props.searchParams.EMP_NO } ).then(res => {
        // 산재, 휴직일 종료기간 지정
        const setRestEndDate = (list) => {
          // 2. 종료일 지정 (다음 시작일의 하루 전)

          // 리스트 하나씩 FOR문
          for (let i = 0; i < list.length; i++) {
            const current = list[i]
            const next = list[i + 1]
            current.START_DATE = dayjs(current.ACT_DATE)
            if (!isEmpty(next)) {
              const nextDate = dayjs(next.ACT_DATE)
              current.END_DATE = nextDate.add(-1, 'day')
            } else {
              // 마지막 요소는 종료일 없음
              current.END_DATE = dayjs()
            }
          }
          return list
        }
        
        // 수행업무 이력 종료기간 지정
        const setHrEndDate = (list) => {
          // 2. 종료일 지정 (다음 시작일의 하루 전)
          let result = []
          let tempJob = '' //JOBCODE_NM

          // 리스트 하나씩 FOR문
          for (let i = 0; i < list.length; i++) {
            const current = list[i]
            let dept = current.DEPTNAME.split('-')
            let jobCode = current.JOBCODE_NM.split('-')

            current.START_DATE = dayjs(current.ACT_DATE)
            // 퇴직일 경우
            if(current.ACTION_REASON_DESCR.includes('퇴직')) {
              let prev = result[result.length - 1]
              if(!isEmpty(prev)) {
                prev.END_DATE = current.ACT_DATE
                prev.DEPTNAME = dept.length == 1 ? dept[0] : dept[1]
              }
              result.push(current)
            } else if(tempJob != jobCode[jobCode.length - 1].trim()){
              current.DEPTNAME = dept.length == 1 ? dept[0] : dept[1]
              current.JOBCODE_NM = jobCode[jobCode.length - 1].trim()
              tempJob = jobCode[jobCode.length - 1].trim()
              result.push(current)
            }
          }
          return result
        }

        let hrList = res.data.filter(item => !item.ACTION_REASON_DESCR.includes('임금') && !item.ACTION_REASON_DESCR.includes('급여'))
        hrList.reverse()
        let restHrList = setRestEndDate(hrList.filter(item => item.ACTION_REASON_DESCR.includes('휴직') || item.ACTION_REASON_DESCR.includes('복직')))

        let workList = setHrEndDate(hrList.filter(item => !isEmpty(item.DEPTNAME)))
        let restList = restHrList.filter(item => !item.ACTION_REASON_DESCR.includes('공상') && item.ACTION_REASON_DESCR.includes('휴직'))
        let hurtList = restHrList.filter(item => item.ACTION_REASON_DESCR.includes('공상'))


        let idx = 0
        // 기간별 수행업무
        let workData = []
        for (let i = 0; i < workList.length; i++) {
          let work = workList[i]
          let next = workList[i + 1]
          if(work.ACTION_REASON_DESCR.includes('퇴직')) {
            continue
          }
          if(!isEmpty(next)) {
            work.END_DATE = dayjs(next.ACT_DATE).add(-1, 'day')
          } else {
            work.END_DATE = dayjs()
          }
          
          let dept = work.DEPTNAME.split('-')
          let jobCode = work.JOBCODE_NM.split('-')
          work.DEPTNAME = dept[dept.length - 1]
          work.JOBCODE_NM = jobCode[jobCode.length - 1]
          work.START_DATE = dayjs(work.ACT_DATE).format('YYYY-MM-DD')
          work.TOTAL_DATE = work.END_DATE.diff(work.START_DATE, 'month')
          work.TOTAL_DATE = (Math.trunc(work.TOTAL_DATE / 12) >= 1 ? Math.trunc(work.TOTAL_DATE / 12) + '년 ' : '') + work.TOTAL_DATE % 12 + '개월'
          work.END_DATE = work.END_DATE.format('YYYY-MM-DD')
          work.CMPNY_DIV = props.searchParams.CMPNY_DIV
          work.EMP_NO = props.searchParams.EMP_NO
          work.IDX = i
          workData.push(work)
        }

        // 과거 산업재해 이력
        for(let hurt of hurtList) {
          if(isEmpty(hurt.END_DATE)) {
            continue
          }

          if(hurt.ACTION_REASON_DESCR.includes('사고공상')) {
            hurt.REST_GUBUN = '사고성'
          } else {
            hurt.REST_GUBUN = '비사고성'
          }
          hurt.DIAGNOSIS_DATE = dayjs(hurt.ACT_DATE).format('YYYY-MM-DD')
          hurt.START_DATE = dayjs(hurt.ACT_DATE).format('YYYY-MM-DD')
          hurt.TOTAL_DATE = dayjs(hurt.END_DATE).diff(hurt.START_DATE, 'day')
          hurt.END_DATE = dayjs(hurt.END_DATE).format('YYYY-MM-DD')
          hurt.CMPNY_DIV = props.searchParams.CMPNY_DIV
          hurt.EMP_NO = props.searchParams.EMP_NO
          hurt.IDX = idx
          idx++
        }

        idx = 0
        // 휴직/휴업 이력
        for(let rest of restList) {
          if(isEmpty(rest.END_DATE)) {
            continue
          }

          rest.REST_GUBUN = rest.ACTION_REASON_DESCR.replaceAll('휴직/', '')
          rest.START_DATE = dayjs(rest.ACT_DATE).format('YYYY-MM-DD')
          rest.TOTAL_DATE = dayjs(rest.END_DATE).diff(rest.START_DATE, 'day')
          rest.END_DATE = dayjs(rest.END_DATE).format('YYYY-MM-DD')
          rest.CMPNY_DIV = props.searchParams.CMPNY_DIV
          rest.EMP_NO = props.searchParams.EMP_NO
          rest.IDX = idx
          idx++
        }
      
        workData.sort((a,b) => dayjs(b.ACT_DATE) - dayjs(a.ACT_DATE))

        grd1.value.getDataProvider().setRows(workData)
        grd2.value.getDataProvider().setRows(hurtList)
        grd3.value.getDataProvider().setRows(restList)
      })
    }
  })
}

const initGrid = () => {
  grd1.value.getDataProvider().setRows([])
  grd2.value.getDataProvider().setRows([])
  grd3.value.getDataProvider().setRows([])
  if(!isEmpty(scrollBox.value?.$el)) {
    scrollBox.value.$el.scrollTop = 0
  } 
}

onMounted(() => {
  
})

defineExpose({
  getData,
  getGridData,
  initGrid,
  getHistoryData
})
</script>

<template>
  <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move">
    <span>사업주 조사서1</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <IGridTitle 
      :button-list="['btnNext', 'btnClose']"  
      @click-button="onButtonsClick" 
      class="mt-2 mr-2"
    ></IGridTitle>
    <v-card-text ref="scrollBox" class="pa-2 pt-0">
      <div class="scrollBoxDiv">
        <table class="w-100">
            <tbody>
                <tr>
                  <td class="title-text1 pa-2" colspan=7>작업자 정보</td>
                </tr>
                <tr>
                  <td class="title-text2 left-cell">성명</td>
                  <td>{{ props.searchParams.EMP_NM }}</td>
                  <td colspan=2 class="title-text2">생년월일</td>
                  <td colspan=2> {{ !isEmpty(props.searchParams.BIRTH_DAY) ? dayjs(props.searchParams.BIRTH_DAY).format('YYYY년 MM월 DD일') : '' }}</td>
                </tr>
                <tr>
                  <td class="title-text2 left-cell">만 나이</td>
                  <td>{{ getAge }}</td>
                  <td colspan=2 class="title-text2">입사일</td>
                  <td colspan=2>{{ !isEmpty(props.searchParams.COM_ENT_DATE) ? dayjs(props.searchParams.COM_ENT_DATE).format('YYYY년 MM월 DD일') : '' }}</td>
                </tr>
                <tr> 
                  <td class="title-text2 left-cell">직위</td>
                  <td>{{ props.searchParams.JOB_TIT_NM }}</td>
                  <td colspan=2 class="title-text2">휴직일/퇴직일</td>
                  <td colspan=1>{{ props.searchParams.HLD_OFFI_GBN }}</td>
                  <td colspan=1>{{ props.searchParams.HLD_OFFI_GBN == '재직' ? ' ' : props.searchParams.RETI_DATE }}</td>
                </tr>
                <tr>
                  <td class="title-text2 left-cell">직종</td>
                  <td>{{ props.searchParams.STD_DUTY_NM }}</td>
                  <td class="title-text2">현 직장 경력</td>
                  <td colspan=3>{{ getWorkDate }}</td>
                </tr>
                <tr class="grid-tr">
                  <td class="title-text2 left-cell">현재까지 기간별 수행업무</td>
                  <td colspan=5>
                    <RealGrid 
                      ref="grd1"
                      style="height: 200px;"
                      :grid-view-option="grd1Props.gridViewOption"
                      :keys="grd1Props.keys"
                      :fields="grd1Props.fields"
                      :columns="grd1Props.columns"
                    />
                  </td>
                </tr>
                <tr class="grid-tr">
                  <td class="title-text2 left-cell">과거 산업재해 이력</td>
                  <td colspan=5>
                    <RealGrid 
                      ref="grd2"
                      style="height: 200px;"
                      :grid-view-option="grd2Props.gridViewOption"
                      :keys="grd2Props.keys"
                      :fields="grd2Props.fields"
                      :columns="grd2Props.columns"
                    />
                  </td>
                </tr>
                <tr class="grid-tr">
                  <td class="title-text2 left-cell">휴직/휴업 이력</td>
                  <td colspan=5>
                    <RealGrid 
                      ref="grd3"
                      style="height: 200px;"
                      :grid-view-option="grd3Props.gridViewOption"
                      :keys="grd3Props.keys"
                      :fields="grd3Props.fields"
                      :columns="grd3Props.columns"
                    />
                  </td>
                </tr>
                <tr>
                  <td class="title-text1 pa-2" colspan=6>작업 관련 일반정보</td>
                </tr>
                <tr>
                  <td class="title-text2 left-cell">통상 근무시간</td>
                  <td>일 8시간</td>
                  <td colspan=2>08:00~17:00</td>
                  <td colspan=2>주 5일</td>
                </tr>
                <tr>
                  <td class="title-text2 left-cell">연장 근무</td>
                  <td>
                    <div class="d-flex">
                      <p class="mr-2">평균 주</p>
                      <i-input
                        v-model="searchParams.OVERTIME_CNT"
                        type="number"
                        width="60px"
                        maxlength="10"
                        class="cell-in-input"
                      />
                      <p>회</p>
                    </div>
                  </td>
                  <td colspan=2>
                    <div class="d-flex">
                      <i-input
                        v-model="searchParams.OVERTIME"
                        type="number"
                        width="100px"
                        maxlength="10"
                        class="cell-in-input"
                      />
                      <p> 시간 연장 근무</p>
                    </div>
                  </td>
                  <td colspan=2>
                    <i-select
                      v-model="searchParams.OVERTIME_CLOCK"
                      :items="codeList.OVERTIME"
                      item-value="COD"
                      item-title="COD" 
                      width="200px"
                    />
                  </td>
                </tr>
                <tr>
                  <td class="title-text2 left-cell">특근</td>
                  <td>
                    <div class="d-flex">
                      <p class="mr-2">평균 주</p>
                      <i-input
                        v-model="searchParams.SPECIAL_CNT"
                        type="number"
                        width="60px"
                        maxlength="10"
                        class="cell-in-input"
                      />
                      <p>회</p>
                    </div>
                  </td>
                  <td colspan=2>
                    <div class="d-flex">
                      <i-input
                        v-model="searchParams.SPECIAL"
                        type="number"
                        width="100px"
                        maxlength="10"
                        class="cell-in-input"
                      />
                      <p> 시간 근무</p>
                    </div>
                  </td>
                  <td colspan=2>
                    <i-select
                      v-model="searchParams.SPECIAL_CLOCK"
                      :items="codeList.SPECIAL"
                      item-value="COD"
                      item-title="COD" 
                      width="200px"
                    />
                  </td>
                </tr>
              
                <tr>
                  <td class="title-text2 left-cell" rowspan=2>휴게시간</td>
                  <td>점심 식사</td>
                  <td>12:00~13:00</td>
                  <td rowspan=2>휴식 시간</td>
                  <td colspan=2>10:00~10:10</td>
                </tr>
                <tr>
                  <td>저녁 식사</td>
                  <td>19:00~20:00</td>
                  <td colspan=2>15:00~15:10</td>
                </tr>
                <tr>
                  <td class="title-text2 left-cell" rowspan=2>근로 형태</td>
                  <td rowspan=4>
                    <v-radio-group
                      inline
                      v-model="searchParams.WORK_SHIFT"
                    >
                      <v-radio label="주간 고정" value="D" />
                      <v-radio label="교대 근무" value="N" />
                    </v-radio-group>
                  </td>
                  <td>주간 근무</td>
                  <td>월
                    <i-input
                      v-model="searchParams.DAY_WORK_CNT"
                      type="number"
                      width="60px"
                      maxlength="10"
                      class="cell-in-input"
                    />회</td>
                  <td colspan="2">
                    <i-select
                      v-model="searchParams.DAY_WORK_TIME"
                      :items="codeList.DAY"
                      item-value="COD"
                      item-title="COD" 
                      width="200px"
                    />
                  </td>
                </tr>
                <tr> 
                  <td>야간 근무</td>
                  <td>월{{ 31 - searchParams.DAY_WORK_CNT }}회</td>
                  <td colspan="2">
                    <i-select
                      v-model="searchParams.NIGHT_WORKTIME"
                      :items="codeList.NIGHT"
                      item-value="COD"
                      item-title="COD" 
                      width="200px"
                    />
                  </td>
                </tr>
            </tbody>
        </table>
      </div>
    </v-card-text>
  </v-card> 
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh);
  overflow-y: auto;
}

.scrollBoxDiv {
  max-height: 65vh; 
  overflow-y: auto; 
  width: 100%;
}

th {
  padding: 6px;
  border: 1px solid #ccc;
  background-color: #f4f5f9;
}

td {
  padding: 6px;
  font-weight: 400;
  border: 1px solid #ccc;
  text-align: center;
  width:180px;
  font-size: 16px;
}
.left-cell {
  width: 200px !important;
  font-weight: bold;
}
.title-text1 {
  font-weight: bold;
  font-size: 28px;
  background-color: #e4e4e4;
}
.title-text2 {
  font-weight: bold;
  font-size: 18px;
  background-color: #e4e4e4;
}
.grid-tr {
  height: 200px;
}
.cell-in-input {
  display: inline-block;
  vertical-align: middle;
}
</style>

