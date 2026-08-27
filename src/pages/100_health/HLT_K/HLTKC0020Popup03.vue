<!--
  화면명 : 건강관리대상자 사후관리 현황 실적등록
  화면개요 : 건강관리대상자 사후관리 현황 실적등록
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'
import { useI18n } from "vue-i18n"
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest2 } from "@hiway/api/commonApi"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag.js"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from "@hiway/utils/notify"

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const title = ref('  ')
const content = ref(null)

/* 조회 조건 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  VEND_CD: '',
  EMP_NO: '',
  VEND_NAME: '',
  IDX_SEQ: '',
  YEAR: '',
  VEND_CD: '',
  VEND_NM: '',
  EMP_NO: '',
  KOR_NM: '',
  PRE_JOB: '',
  BIRTH_DAY: '',
  SEX: '',
  JOIN_DT: '',
  STATURE: '',
  WEIGHT: '',
  BMI: '',
  UNFIT_RES_NAME: '',
  WORK_SWITCH_YN: '',
  SWITCH_WORK: '',
  SWITCH_DESC: '',
  WORK_TIME: '',
  WORK_MNG: '',
  MEDI_TRM: '',
  MEDI_CYCLE: '',
  HEALTH_CARE: '',
  PROTECT: '',
  ATC: '',
  WORK_SWITCH_RESULT: '',
  WORK_SWITCH_REASON: '',
  WORK_TIME_RESULT: '',
  WORK_TIME_REASON: '',
  WORK_MNG_RESULT: '',
  WORK_MNG_REASON: '',
  MEDI_RESULT: '',
  MEDI_REASON: '',
  HEALTH_CARE_RESULT: '',
  HEALTH_CARE_REASON: '',
  PROTECT_RESULT: '',
  PROTECT_REASON: '',
  ATC_RESULT: '',
  ATC_REASON: '',
  DETAIL_REMARK: '',
  CONFIRM_YN: '',
  YYYYMMDD: '',
  HHMM: '',
})

const codeList = reactive({
  WORK_TIME: [],
  WORK_MNG: [],
  MEDI_TRM: [],
  MEDI_CYCLE: [],
  HEALTH_CARE: [],
  PROTECT: [],
  RESULT: [
    { COD: 'A', TXT: '조치 완료' },
    { COD: 'B', TXT: '조치 중' },
    { COD: 'C', TXT: '미조치' },
  ],
})

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIR020'),
    getCodeList('HHIR030'),
    getCodeList('HHIR040'),
    getCodeList('HHIR050'),
    getCodeList('HHIR060'),
    getCodeList('HHIR070')
  ]).then((res) => {

    codeList.WORK_TIME = res[0].ORESULT_CUR
    codeList.WORK_MNG = res[1].ORESULT_CUR
    codeList.MEDI_TRM = res[2].ORESULT_CUR
    codeList.MEDI_CYCLE = res[3].ORESULT_CUR
    codeList.HEALTH_CARE = res[4].ORESULT_CUR
    codeList.PROTECT = res[5].ORESULT_CUR
  })
}

const openPopup = (param) => {
  initCodeList()
  if(!isEmpty(param)) {
    searchParams.VEND_CD = param.VEND_CD
    searchParams.VEND_NM = param.VEND_NAME
    searchParams.IDX_SEQ = param.IDX_SEQ
    searchParams.EMP_NO = param.EMP_NO
    searchParams.YEAR = param.YEAR
    commonSearchApi({ queryId: 'HLTKC0020_SEARCH_04', param: searchParams }).then(res => {
      if(res.ORESULT_CUR.length !== 0) {
        for (let key in res.ORESULT_CUR[0]) {
          if (searchParams.hasOwnProperty(key)) {
            searchParams[key] = res.ORESULT_CUR[0][key]
          }
        }
      } 
      searchParams.WORK_TIME = findCheckValue(searchParams.WORK_TIME, codeList.WORK_TIME)
      searchParams.WORK_MNG = findCheckValue(searchParams.WORK_MNG, codeList.WORK_MNG)
      searchParams.MEDI_TRM = findCheckValue(searchParams.MEDI_TRM, codeList.MEDI_TRM)
      searchParams.MEDI_CYCLE = findCheckValue(searchParams.MEDI_CYCLE, codeList.MEDI_CYCLE)
      searchParams.HEALTH_CARE = findCheckValue(searchParams.HEALTH_CARE, codeList.HEALTH_CARE)
      searchParams.PROTECT = findCheckValue(searchParams.PROTECT, codeList.PROTECT)
      if(searchParams.CONFIRM_YN == 'Y') {
        menuTitle.value.disableBtn('btnCompleteSAF', true)
      } 
    })
  } else { 
    searchParams.VEND_CD = ''
    searchParams.VEND_NM = ''
    searchParams.IDX_SEQ = ''
    searchParams.EMP_NO  = ''
    searchParams.YEAR = '' 
  }
  
  // getMainData()
  dialog.value = true
}

const findCheckValue = (val, cdList) => {
  // val이 null일 시 return
  if(isEmpty(val)) return ' '
  let valList = val.split(',')
  let result = []
  for(let v of valList) {
    result.push(cdList.find(item => item.COD == v).TXT)
  }
  return result.join(', ')
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {

    if(isEmpty(searchParams.EMP_NO)) {
      return Message.warn(t('저장할 인원을 선택하여 주십시오.'))
    }
    saveData()
  } else if (btn.id === 'btnCompleteSAF') {
    searchParams.CONFIRM_YN = 'Y'
    new saveFlowHelper(vm, t)
      .setConfirmMessage('작성완료 하시겠습니까? 이후 수정이 불가능합니다.')
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnPrint') {
    const tableClone = content.value.cloneNode(true)
    
    const commonTable = (table) => {
      table.querySelectorAll('.non-excel').forEach(el => el.remove())
      const inputs = table.querySelectorAll('input')
      inputs.forEach((input) => {
        input.setAttribute('value', input.value) // 최신 입력값을 value 속성에 설정
      })

      // 라디오버튼
      const radioGroups = {}
      const radios = table.querySelectorAll('input[type="radio"]')
      radios.forEach((radio) => {
        const name = radio.name
        if (!radioGroups[name]) radioGroups[name] = []

        radioGroups[name].push(radio)
      })

      Object.values(radioGroups).forEach((group) => {
        const checked = group.find(radio => radio.checked)
        const td = checked?.closest('td')
        if (checked && td) {
          const label = td.querySelector(`label[for="${checked.id}"]`)
          const labelText = label ? label.textContent.trim() : checked.value
          td.textContent = labelText // 라디오 텍스트만 표시
        }
      })

      //체크박스
      const checkBox = table.querySelectorAll('.checkbox-group')
      checkBox.forEach(group => {
        const codeListName = group.dataset.codeList  // 예: 'list2'
        const codeListData = codeList[codeListName]  // 예: codeList.list2

        const checkedBoxes = group.querySelectorAll('input[type="checkbox"]:checked');
        const selectedCodes = Array.from(checkedBoxes).map(input => input.value);

        const selectedLabels = codeListData
          .filter(item => selectedCodes.includes(item.COD))
          .map(item => item.TXT);

        const td = group.closest('td')
        if (td) td.textContent = selectedLabels.join(', ')
      })
    }

    commonTable(tableClone)

    // 3. 반영된 HTML 가져오기
    let htmlContent = [
      {code: tableClone.outerHTML, name: '실적등록'}, 
    ]

    commonRequest2('hse/excel/HLTJB0010_PRINT01', { 
        data: { 
          htmlCode: htmlContent, 
          fileId: searchParams.FILE_ID 
        },
      }).then( async (res) => {
      // 헤더에서 파일명 추출
      const contentDisposition = res.contentDisposition;
      let fileName = `건강관리대상자 사후관리현황 실적등록 ${searchParams.KOR_NM}.xlsx`  // 기본 파일명
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = decodeURIComponent(fileNameMatch[1])
        }
      }
      // 파일 다운로드
      const blob = new Blob([res], { type: res.type })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      URL.revokeObjectURL(link.href)
      document.body.removeChild(link)
    })
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

// 저장 전
const beforeSave = () => {
  if (isEmpty(searchParams.WORK_SWITCH_RESULT) && searchParams.WORK_SWITCH_YN === 'Y') {
    searchParams.CONFIRM_YN = 'N'
    return Message.warn(t('작업전환 조치 여부를 입력하세요'))
  } else if (isEmpty(searchParams.WORK_TIME_RESULT) && !searchParams.WORK_TIME.includes('없음')) {
    searchParams.CONFIRM_YN = 'N'
    return Message.warn(t('작업시간 조정 조치 여부를 입력하세요.'))
  } else if (isEmpty(searchParams.WORK_MNG_RESULT) && !searchParams.WORK_MNG.includes('없음')) {
    searchParams.CONFIRM_YN = 'N'
    return Message.warn(t('작업관리강화 조치 여부를 입력하세요.'))
  } else if (isEmpty(searchParams.MEDI_RESULT) && !searchParams.MEDI_TRM.includes('없음')) {
    searchParams.CONFIRM_YN = 'N'
    return Message.warn(t('의학적 조치 여부를 입력하세요.'))
  } else if (isEmpty(searchParams.HEALTH_CARE_RESULT) && !searchParams.HEALTH_CARE.includes('없음')) {
    searchParams.CONFIRM_YN = 'N'
    return Message.warn(t('건강증진활동 조치 여부를 입력하세요.'))
  } else if (isEmpty(searchParams.PROTECT_RESULT) && !searchParams.PROTECT.includes('없음')) {
    searchParams.CONFIRM_YN = 'N'
    return Message.warn(t('보호구 지급 조치 여부를 입력하세요.'))
  } else if (isEmpty(searchParams.ATC_RESULT) && !isEmpty(searchParams.ATC)) {
    searchParams.CONFIRM_YN = 'N'
    return Message.warn(t('기타 조치 여부를 입력하세요.'))
  } 

  return true
}

/* ********** 저장 ********** */
const saveData = () => {  
  return commonExecuteApi({ queryId: 'HLTKC0020_SAVE_02', list: [ searchParams ] })
}

const afterSaveData = (res) => {
  if(!isEmpty(res)) {
    Message.success(t('성공적으로 저장되었습니다'))
  }
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  dialog.value = false

  menuTitle.value.disableBtn('btnCompleteSAF', false)
}

const isNullSpace = (value) => {
  return isEmpty(value) ? ' ' : value
}

defineExpose({
  openPopup
})

watch(() => [searchParams.STATURE, searchParams.WEIGHT], (newValue, oldValue) => {
  if(isEmpty(searchParams.STATURE) || isEmpty(searchParams.WEIGHT)) {
    return
  }
  searchParams.BMI = Math.trunc(searchParams.WEIGHT / Math.pow(searchParams.STATURE / 100, 2) * 100) / 100
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
      <span>실적 등록</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :title="$t(isNullSpace(title))"
          :button-list="['btnCompleteSAF', 'btnPrint', 'btnClose']"
          @click-button="onButtonsClick"
          :use-permission="false"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area" style="height:750px;">
        <div ref="content" class="pa-4">
          <table border="1" cellspacing="1" cellpadding="5" style="width: 100%; text-align: center;">
            <thead> 
              <tr>
                <th class="title1" style="width:150px">협력사명</th>
                <th class="title1" colspan="2" style="width:150px">
                  {{ searchParams.VEND_NM }}
                </th>
                <th class="title1" style="width:100px">일자</th>
                <th class="title1" colspan="2" style="width:200px">
                  <div>{{ searchParams.YYYYMMDD }}</div>
                </th>
                <th class="title1" style="width:150px">시간</th>
                <th class="title1" colspan="1" style="width:150px">
                  <div>{{ searchParams.HHMM }}</div>
                </th>
              </tr>
              <tr>
                <td class="title2" colspan="8">인적사항</td>
              </tr>
              <tr>
                <td class="title1">성 명</td>
                <td colspan="2">
                  {{ searchParams.KOR_NM }}
                </td>
                <td class="title1">사번</td>
                <td colspan="2">
                  {{ searchParams.EMP_NO }}
                </td>
                <td class="title1">현재 직무</td>
                <td colspan="1">
                  {{ searchParams.PRE_JOB }}
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="title1">생년월일(나이)</td>
                <td colspan="2">
                  <input type="text" v-model="searchParams.BIRTH_DAY" readonly/>
                </td>
                <td class="title1">성 별</td>
                <td colspan="2">
                  <v-radio-group inline v-model="searchParams.SEX" class="ml-3" readonly>
                    <v-radio label="남" value="M"></v-radio>
                    <v-radio label="여" value="W"></v-radio>
                  </v-radio-group>
                </td>
                <td class="title1">입사일</td>
                <td colspan="1">
                  {{ searchParams.JOIN_DT }}
                </td>
              </tr>
              <tr>
                <td class="title1">키</td>
                <td colspan="2">
                  {{ searchParams.STATURE }}
                </td>
                <td class="title1">몸무게</td>
                <td colspan="2">
                   {{ searchParams.WEIGHT }}
                </td>
                <td class="title1">BMI</td>
                <td colspan="1">
                  {{ searchParams.BMI }}
                </td>
              </tr>
              <tr>
                <td class="title2" colspan="8">건강관리 항목</td>
              </tr>
              <tr>
                <td colspan="8">
                  {{ searchParams.UNFIT_RES_NAME }} 
                </td>
              </tr>
              <tr>
                <td class="title2" colspan="8">사후관리 계획</td>
              </tr>
              <tr>
                <td class="title1">내용</td>
                <td class="title1" colspan="3">계획</td>
                <td class="title1" colspan="2">조치 여부</td>
                <td class="title1" colspan="2">미조치 사유</td>
              </tr>
              <tr>
                <td class="title1">작업 전환</td>
                <td colspan="3" class="left-align">
                  {{ searchParams.WORK_SWITCH_YN === 'Y' ?  '있음(' + searchParams.SWITCH_WORK + ')' : '없음' }}
                </td>
                <td colspan="2">
                  <VRadioGroup v-model="searchParams.WORK_SWITCH_RESULT" inline :readonly="searchParams.CONFIRM_YN == 'Y'" :disabled="searchParams.WORK_SWITCH_YN === 'N'">
                    <VRadio
                      v-for="item in codeList.RESULT"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </VRadioGroup> 
                </td>
                <td colspan="2">
                  <v-text-field
                    v-model="searchParams.WORK_SWITCH_REASON"
                    dense
                    outlined
                    width="100%"
                    :readonly="searchParams.WORK_SWITCH_RESULT != 'C' || searchParams.CONFIRM_YN == 'Y'"
                  />
                </td>
              </tr>
              <tr>
                <td class="title1">작업 시간 조정</td>
                <td colspan="3" class="left-align">
                  {{ searchParams.WORK_TIME }}
                </td>
                <td colspan="2">
                  <VRadioGroup v-model="searchParams.WORK_TIME_RESULT" inline :readonly="searchParams.CONFIRM_YN == 'Y'" :disabled="searchParams.WORK_TIME.includes('없음')">
                    <VRadio
                      v-for="item in codeList.RESULT"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </VRadioGroup>
                </td>
                <td colspan="2">
                  <v-text-field
                    v-model="searchParams.WORK_TIME_REASON"
                    dense
                    outlined
                    width="100%"
                    :readonly="searchParams.WORK_TIME_RESULT != 'C' || searchParams.CONFIRM_YN == 'Y'"
                  />
                </td>
              </tr>
              <tr>
                <td class="title1">작업 관리 강화<br><div style="color: red;">(고령자 필수)</div></td>
                <td colspan="3" class="left-align">
                  {{ searchParams.WORK_MNG }}
                </td>
                <td colspan="2">
                  <VRadioGroup v-model="searchParams.WORK_MNG_RESULT" inline :readonly="searchParams.CONFIRM_YN == 'Y'" :disabled="searchParams.WORK_MNG.includes('없음')">
                    <VRadio
                      v-for="item in codeList.RESULT"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </VRadioGroup>
                </td>
                <td colspan="2">
                  <v-text-field
                    v-model="searchParams.WORK_MNG_REASON"
                    dense
                    outlined
                    width="100%"
                    :readonly="searchParams.WORK_MNG_RESULT != 'C' || searchParams.CONFIRM_YN == 'Y'"
                  />
                </td>
              </tr>
              <tr>
                <td class="title1" rowspan="2">의학적 조치</td>
                <td colspan="3" class="left-align">
                  {{ searchParams.MEDI_TRM }}
                </td>
                <td colspan="2" rowspan="2">
                  <VRadioGroup v-model="searchParams.MEDI_RESULT" inline :readonly="searchParams.CONFIRM_YN == 'Y'" :disabled="searchParams.MEDI_TRM.includes('없음')">
                    <VRadio
                      v-for="item in codeList.RESULT"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </VRadioGroup>
                </td>
                <td colspan="2" rowspan="2">
                  <v-text-field
                    v-model="searchParams.MEDI_REASON"
                    dense
                    outlined
                    width="100%"
                    :readonly="searchParams.MEDI_RESULT != 'C' || searchParams.CONFIRM_YN == 'Y'"
                  />
                </td>
              </tr>
              <tr>
                <td colspan="3" class="left-align">
                  {{ searchParams.MEDI_CYCLE }}
                </td>
              </tr>
              <tr>
                <td class="title1">건강증진활동</td>
                <td colspan="3" class="left-align">
                  {{ searchParams.HEALTH_CARE }}
                </td>
                <td colspan="2">
                  <VRadioGroup v-model="searchParams.HEALTH_CARE_RESULT" inline :readonly="searchParams.CONFIRM_YN == 'Y'" :disabled="searchParams.HEALTH_CARE.includes('없음')">
                    <VRadio
                      v-for="item in codeList.RESULT"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </VRadioGroup>
                </td>
                <td colspan="2">
                  <v-text-field
                    v-model="searchParams.HEALTH_CARE_REASON"
                    dense
                    outlined
                    width="100%"
                    :readonly="searchParams.HEALTH_CARE_RESULT != 'C' || searchParams.CONFIRM_YN == 'Y'"
                  />
                </td>
              </tr>
              <tr>
                <td class="title1">보호구 지급</td>
                <td colspan="3" class="left-align">
                  {{ searchParams.PROTECT }}
                </td>
                <td colspan="2">
                  <VRadioGroup v-model="searchParams.PROTECT_RESULT" inline :readonly="searchParams.CONFIRM_YN == 'Y'" :disabled="searchParams.PROTECT.includes('없음')">
                    <VRadio
                      v-for="item in codeList.RESULT"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </VRadioGroup>
                </td>
                <td colspan="2">
                  <v-text-field
                    v-model="searchParams.PROTECT_REASON"
                    dense
                    outlined
                    width="100%"
                    :readonly="searchParams.PROTECT_RESULT != 'C' || searchParams.CONFIRM_YN == 'Y'"
                  />
                </td>
              </tr>
              <tr>
                <td class="title1">기타</td>
                <td colspan="3" class="left-align">
                  {{ searchParams.ATC }}
                </td>
                <td colspan="2">
                  <VRadioGroup 
                    v-model="searchParams.ATC_RESULT" 
                    inline 
                    :readonly="searchParams.CONFIRM_YN == 'Y'"
                    :disabled="isEmpty(searchParams.ATC)">
                    <VRadio
                      v-for="item in codeList.RESULT"
                      :key="item"
                      :value="item.COD"
                      :label="item.TXT"
                    />
                  </VRadioGroup>
                </td>
                <td colspan="2">
                  <v-text-field
                    v-model="searchParams.ATC_REASON"
                    dense
                    outlined
                    width="100%"
                    :readonly="searchParams.ATC_RESULT != 'C' || searchParams.CONFIRM_YN == 'Y'"
                  />
                </td>
              </tr>
              <tr>
                <td class="title2" colspan="8">세부내용</td>
              </tr>
              <tr>
                <td colspan="8">
                  <v-text-field 
                    width="100%" 
                    v-model="searchParams.DETAIL_REMARK" 
                    dense
                    outlined
                    :readonly="searchParams.CONFIRM_YN == 'Y'" 
                  />
                </td>
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
.left-align {
  text-align: left;
}
td {
  padding: 6px;
  font-weight: 400;
  border: 1px solid #ccc;
  text-align: center;
  font-size: 13px;
}

.title1 {
  background-color: #f4f5f9;
  font-weight: 500;
  font-size: 14px;
}

.title2 {
  background-color: #d9d9d9;
  font-weight: bold;
  font-size: 14px;
}

</style>
