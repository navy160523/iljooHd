<!--
  화면명 : 난청 직력확인서
  화면개요 : 난청 직력확인서
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted, nextTick } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, commonRequest, getCodeList, commonRequest2, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  BIRTH_DAY: '', // 생일
  HLD_OFFI_GBN: '', // 재직구분
  BSNS_NM: '', // 사업부
  DEPT_NM: '', // 부서
  ASGN_NM: '', // 과
  STD_DUTY_NM: '', // 직종(상세분류중 중간)
  UNT_DUTY_NM: '', // 직종(상세분류중 마지막)
  JOB_TIT_NM: '', // 직위
  COM_ENT_DATE: '', // 입사일자
  RETI_DATE: '', // 휴,퇴직일
  APPLI_GUBUN: '', // 신청구분
  APPLI_GUBUN_NM: '', // 신청구분명
  HOSPITAL_CODE: '', // 진단기관
  HOSPITAL_NM: '', // 진단기관명
  DIAGNOSIS_DATE: '', // 진단일
  DISEASE_NM: '', // 상병명
  APPLI_DATE: '', // 진정일(pk)
  INCIDENT_CODE: '', // 발생경위 코드
  INCIDENT_NM: '', // 발생경위
  NOTIFY_FILE_ID: '', // 사실통지서
  WORK_YEAR: '',
  REMARK: '',
  SAVE_YN: '',
  FILE_ID: '',
})

//그리드 속성셋팅 
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }, },
  keys : [], 
  fields : [ 
    { fieldName: 'DEPTNAME', width: '80', dataType: 'text', header: { text: t('소속') }},
    { fieldName: 'JOBCODE_NM', width: '80', dataType: 'text', header: { text: t('직무') }},
    { fieldName: 'START_DATE', width: '60', dataType: 'text', header: { text: t('시작일') }},
    { fieldName: 'END_DATE', width: '60', dataType: 'text', header: { text: t('종료일') }},
    { fieldName: 'TOTAL_DATE', width: '40', dataType: 'text', header: { text: t('기간') }},
    
    // 안보이는거
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') },visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'IDX', dataType: 'text', header: { text: t('인덱스') },visible: false, },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

// 팝업 OPEN
const openPopup = (param) => {
  for (let key in param) {
    if (searchParams.hasOwnProperty(key)) {
      if(key === 'DIAGNOSIS_DATE' && !isEmpty(param.DIAGNOSIS_DATE)) {
        searchParams.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYYMMDD')
      } else if (key === 'APPLI_DATE' && !isEmpty(param.APPLI_DATE)) {
        searchParams.APPLI_DATE = dayjs(param.APPLI_DATE).format('YYYYMMDD')
      } else if (key === 'BIRTH_DAY' && !isEmpty(param.BIRTH_DAY)) {
        searchParams.BIRTH_DAY = dayjs(param.BIRTH_DAY).format('YYYY-MM-DD')
      } else if (key === 'COM_ENT_DATE' && !isEmpty(param.COM_ENT_DATE)) {
        searchParams.COM_ENT_DATE = dayjs(param.COM_ENT_DATE).format('YYYY-MM-DD')
      } else if (key === 'RETI_DATE' && !isEmpty(param.RETI_DATE)) {
        searchParams.RETI_DATE = dayjs(param.RETI_DATE).format('YYYY-MM-DD')
      } else {
        searchParams[key] = param[key]
      }
    }
  }
  searchParams.SAVE_YN = 'Y'

  // 저장된 사업주 조사서2, 직력확인서 비고 조회
  commonSearchApi({ queryId : 'HLTJB0030_SEARCH_05', param: searchParams }).then(res => {
    if(isEmpty(res.ORESULT_CUR)) {
      searchParams.REMARK = ''
    } else {
      searchParams.REMARK = res.ORESULT_CUR[0].REMARK
    }
  })

  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getGridView().setRowIndicator({ visible: false })
  commonSearchApi({ queryId : 'HLTJB0030_SEARCH_06', param: searchParams }).then(res => {
    if(isEmpty(res.ORESULT_CUR)) {
      commonRequest('/hse/health/HLTJB0010_GET_02', { EMP_NO: searchParams.EMP_NO } ).then(res => {
        // 산재, 휴직일 종료기간 지정
        const setRestEndDate = (list) => {
          let result = []

          for (let i = 0; i < list.length; i++) {
            const current = list[i]
            let dept = current.DEPTNAME.split('-')
            current.START_DATE = dayjs(current.ACT_DATE)
            current.END_DATE = dayjs()
            current.DEPTNAME = dept.length == 1 ? dept[0].trim() : dept[1].trim()
            if(current.ACTION_REASON_DESCR.includes('복직')) {
              const prev = result[result.length - 1]
              if(!isEmpty(prev)) {
                prev.END_DATE = current.START_DATE.add(-1, 'day')
              }
            } else {
              result.push(current)
            }
          }
          return result
        }
        
        const setHrEndDate = (list) => {
          // 2. 종료일 지정 (다음 시작일의 하루 전)
          let result = []
          let tempJob = '' //JOBCODE_NM
          for (let i = 0; i < list.length; i++) {
            const current = list[i]
            let dept = current.DEPTNAME.split('-')
            let jobCode = current.JOBCODE_NM.split('-')
            let prev = result[result.length - 1]

            current.START_DATE = dayjs(current.ACT_DATE)
            if(current.ACTION_REASON_DESCR.includes('퇴직')) {
              if(!isEmpty(prev)) {
                prev.END_DATE = dayjs(current.ACT_DATE).subtract(1, 'day')
                prev.DEPTNAME = dept.length == 1 ? dept[0].trim() : dept[1].trim()
              }
            } else if(tempJob != jobCode[jobCode.length - 1].trim()){
              if(!isEmpty(prev)) {
                prev.END_DATE = dayjs(current.ACT_DATE).subtract(1, 'day')
              }
              current.DEPTNAME = dept.length == 1 ? dept[0].trim() : dept[1].trim()
              current.JOBCODE_NM = jobCode[jobCode.length - 1].trim()
              tempJob = jobCode[jobCode.length - 1].trim()
              result.push(current)
            }
          }
          return result
        }

        // 수행업무 기간 중 휴직기간 제외    
        const subtractLeavePeriods = (work, leaves) => {
          const result = []

          let workStart = dayjs(work.START_DATE)
          let workEnd = dayjs(work.END_DATE)
          let currentStart = workStart

          // 휴직 이력 중 해당 근무 기간과 겹치는 것만 필터
          const overlappingLeaves = leaves
            .map(leave => ({
              start: dayjs(leave.START_DATE),
              end: dayjs(leave.END_DATE),
              DEPTNAME: leave.DEPTNAME,
            }))
            .filter(leave =>
              leave.end.diff(workStart, 'day') >= 0 &&  // leave.end >= workStart
              leave.start.diff(workEnd, 'day') <= 0    // leave.start <= workEnd
            )
            .sort((a, b) => a.start.diff(b.start)) // 시작일 오름차순 정렬

          // work.TOTAL_DATE = work.END_DATE.diff(work.START_DATE, 'month')
          // work.TOTAL_DATE = (Math.trunc(work.TOTAL_DATE / 12) > 1 ? Math.trunc(work.TOTAL_DATE / 12) + '년 ' : '') + work.TOTAL_DATE % 12 + '개월'
          for (const leave of overlappingLeaves) {
            // 휴직 시작일이 현재 작업 시작일보다 뒤면 유효 구간 추가
            if (leave.start.diff(currentStart, 'day') > 0) {
              let totalDate = leave.start.diff(currentStart, 'month')
              result.push({
                START_DATE: currentStart.format('YYYY-MM-DD'),
                END_DATE: leave.start.subtract(1, 'day').format('YYYY-MM-DD'),
                DEPTNAME: leave.DEPTNAME,
                JOBCODE_NM: work.JOBCODE_NM,
                TOTAL_DATE: (Math.trunc(totalDate / 12) > 1 ? Math.trunc(totalDate / 12) + '년 ' : '') + totalDate % 12 + '개월'
              })
            }

            // 휴직 종료일 다음 날을 새로운 작업 시작일로 설정
            if (leave.end.diff(currentStart, 'day') >= 0) {
              currentStart = leave.end.add(1, 'day')
            }
          }

          // 남은 작업 기간이 있으면 추가
          if (currentStart.diff(workEnd, 'day') <= 0) {
            let totalDate = workEnd.diff(currentStart, 'month')
            result.push({
              START_DATE: currentStart.format('YYYY-MM-DD'),
              END_DATE: workEnd.format('YYYY-MM-DD'),
              DEPTNAME: work.DEPTNAME,
              JOBCODE_NM: work.JOBCODE_NM,
              TOTAL_DATE: (Math.trunc(totalDate / 12) > 1 ? Math.trunc(totalDate / 12) + '년 ' : '') + totalDate % 12 + '개월'
            })
          }
          return result
        }

        // 인사발령정보 가공
        let workList = []
        let idx = 0
        let hrList = res.data.filter(item => !item.ACTION_REASON_DESCR.includes('임금') && !item.ACTION_REASON_DESCR.includes('급여'))
        hrList.reverse()
        let restHrList = setRestEndDate(hrList.filter(item => item.ACTION_REASON_DESCR.includes('휴직') || item.ACTION_REASON_DESCR.includes('복직')))
        hrList = setHrEndDate(hrList.filter(item => !isEmpty(item.DEPTNAME)))

        // 수행업무 이력중 휴직기간을 빼서 재 가공
        for(let work of hrList) {
          const adjusted = subtractLeavePeriods(work, restHrList);
          workList.push(...adjusted);
        }
        
        // 인덱스 키 값 넣어버리기
        for(let work of workList) {
          work.IDX = idx
          work.CMPNY_DIV = searchParams.CMPNY_DIV
          work.EMP_NO = searchParams.EMP_NO
          idx++
        }
        
        grdMain.value.getDataProvider().setRows(workList)
      })
    } else {
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
  dialog.value = true
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  dialog.value = false
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    vm.$swal({ title: t('저장하시겠습니까?'), showCancelButton: true }).then(res => {
      if (res.isConfirmed) {
        searchParams.DIAGNOSIS_DATE = dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD')
        commonExecuteApi({ queryId : 'HLTJB0030_SAVE_04', list: [ searchParams ] }).then(res => {
          commonExecuteApi({ queryId : 'HLTJB0030_SAVE_07', list: grdMain.value.getDataProvider().getJsonRows(0,-1) }).then(res => {
            Message.info(t('저장되었습니다.'))
            closePopup()
          })
        })
      }
    })
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}


// 근무일수 계산
const getWorkDate = () => {
  if(isEmpty(searchParams.COM_ENT_DATE)) {
    return ''
  }
  const joinDate = dayjs(searchParams.COM_ENT_DATE, 'YYYY-MM-DD') // 입사일
  const resignDate = dayjs(searchParams.RETI_DATE || dayjs()) // 퇴직/휴직일
  // 총 근무 연수 계산
  const years = resignDate.diff(joinDate, 'year')
  // 남은 개월 수 계산
  const months = resignDate.diff(joinDate.add(years, 'year'), 'month')
  // 결과 문자열 반환
  return `${years}년 ${months}개월`
}

// 만 나이 구하기
const getAge = () => {
  if(isEmpty(searchParams.BIRTH_DAY)) {
    return ''
  }
  // 생년월일을 dayjs 객체로 생성
  const birthDate = dayjs(searchParams.BIRTH_DAY, 'YYYY-MM-DD')
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
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    height="950"
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
      <span>직력 확인서 미리보기</span>
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
      <v-card-text class="pa-2 pt-0 content-area">
        <div>
          <table class="w-100">
            <tbody>
                <tr>
                  <td class="title-text1 pa-2" colspan=7>직력확인서</td>
                </tr>
                <tr>
                  <td class="left-cell title-text2">성명</td>
                  <td>{{ searchParams.EMP_NM }}</td>
                  <td class="title-text2">생년월일</td>
                  <td colspan=3> {{ isEmpty(searchParams.BIRTH_DAY) ? '' : dayjs(searchParams.BIRTH_DAY).format('YYYY년 MM월 DD일') }}</td>
                </tr>
                <tr>
                  <td class="left-cell title-text2">만 나이</td>
                  <td>{{ getAge() }}</td>
                  <td class="title-text2">입사일</td>
                  <td colspan=3>{{ isEmpty(searchParams.COM_ENT_DATE) ? '' : dayjs(searchParams.COM_ENT_DATE).format('YYYY년 MM월 DD일') }}</td>
                </tr>
                <tr>
                  <td class="left-cell title-text2">직위</td>
                  <td>{{ searchParams.JOB_TIT_NM }}</td>
                  <td class="title-text2">휴직일/퇴직일</td>
                  <td colspan=1>{{ searchParams.HLD_OFFI_GBN }}</td>
                  <td colspan=2>{{ searchParams.HLD_OFFI_GBN == '재직' ? ' ' : searchParams.RETI_DATE }}</td>
                </tr>
                <tr> 
                  <td class="left-cell title-text2">직무</td>
                  <td>{{ searchParams.UNT_DUTY_NM }}</td>
                  <td class="title-text2">현 직장 경력</td>
                  <td colspan=3>{{ getWorkDate() }}</td>
                </tr>
                <tr style="height:300px;">
                  <td class="left-cell title-text2">현재까지 기간별 수행업무</td>
                  <td colspan=5>
                    <RealGrid 
                      ref="grdMain"
                      style="height: 280px;"
                      :grid-view-option="grdMainProps.gridViewOption"
                      :keys="grdMainProps.keys"
                      :fields="grdMainProps.fields"
                      :columns="grdMainProps.columns"
                    />
                  </td>
                </tr>
                <tr>
                  <td class="left-cell title-text2">비고</td>
                  <td colspan=5>
                    <i-textarea
                      v-model="searchParams.REMARK"
                      width="100%"
                    />
                  </td>
                </tr>
                <tr>
                  <td class="title-text2" colspan=6>위의 기재 내용이 틀림없음을 확인합니다.</td>
                </tr>
                <tr>
                  <td class="left-cell title-text2" rowspan=3>확인</td>
                  <td class="title-text2">작성일자</td>
                  <td colspan=4>{{ dayjs().format('YYYY년 MM월 DD일') }}</td>
                </tr>
                <tr>
                  <td class="title-text2">근로자 명</td>
                  <td colspan=4>{{ searchParams.EMP_NM }}</td>
                </tr>
                <tr>
                  <td class="title-text2">사용자 명</td>
                  <td colspan=4>에이치디현대중공업 주식회사</td>
                </tr>
            </tbody>
          </table>
        </div> 
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
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
  width: 150px;
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
.cell-in-input {
  display: inline-block;
  vertical-align: middle;
}
</style>
