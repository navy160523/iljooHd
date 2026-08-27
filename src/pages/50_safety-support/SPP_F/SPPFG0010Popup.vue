<!-- SPPFG0010 도급업체 팝업 -->
<!-- SI2팀 손상규 2025-07-02 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useCommonStore } from '@hiway/stores/common'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest2 } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import HHI_color_ko from '@/assets/images/ci/HHI_color_ko.png' 

let dialog = ref(false)
const emit = defineEmits(['upData'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const commonStore = useCommonStore()
const menuTitle = ref(null)

const readOnly = ref(false)

const fixedProvideNames = [
  '물질안전자료(MSDS)',
  '작업허가서(위험작업허가서 포함)',
  '작업절차서(표준작업지침서 포함)'
]

const searchParams = reactive({
  MAIN_SEQ : '',
  DEPT_CD: '',
  YEAR: ''
})

const codeList = reactive({})

const dataParams = reactive({
  YEAR: '',
  MAIN_SEQ: '',
  DEPT_CD: '',
  VEND_NM: '',
  PROVIDE_DT: '',
  provideList: Array.from({ length: 15 }, (_, i) => ({
    SEQ: i + 1,
    PROVIDE_NM: i < 3 ? fixedProvideNames[i] : '',  // 1~3행 고정 제공자료명
    REMARK: ''
  })),
  SAVE_YN: 'N',
  VEND_FLAG: ''
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: dataParams.BSNS_CD,
        USE_DIV: 'Y',
      },
    })
  ]).then((res) => {
    codeList.deptCd = res[0].ORESULT_CUR
  })

}

const getDeptName = (code) => {
  const match = codeList.deptCd?.find(d => d.DEPT_CD == code)
  return match?.DEPT_NM || '';
}

const onButtonsClick = btn => {
  
  if (btn.id === 'btnPrint') {
    fetch(HHI_color_ko)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1]  // ← 헤더 제외
          searchParams.IMG_BASE64 = base64data

          commonStore.loading = true
          commonRequest2('hse/excel/SPPFG0010_EXCEL', searchParams).then((res) => {
            commonStore.loading = false
            const blob = new Blob([res], { type: res.type })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = '도급업체 자료제공현황'
            link.click()
            URL.revokeObjectURL(link.href)
          })
        }
        reader.readAsDataURL(blob)
      })
  } else if (btn.id === 'btnTemporaryStorage') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage('임시저장 하시겠습니까?')
      .setBefore(beforeStorage)
      .setQuery(saveStorage)
      .setAfter(afterStorage)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setConfirmMessage(
        `
          <span style="color: red;">
            ※저장후에는 수정이 불가능합니다.
          </span>
            저장하시겠습니까?
        `
      )
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const afterSearch = (res) => {
  const resultList = res?.ORESULT_CUR || [];

  if (resultList.length > 0) {
    // 조회된 데이터로 15행 구성
    dataParams.provideList = Array.from({ length: 15 }, (_, idx) => {
      const item = resultList[idx];
      return {
        SEQ: idx + 1,
        PROVIDE_NM: item?.PROVIDE_NM || (idx < 3 ? fixedProvideNames[idx] : ''),
        REMARK: item?.REMARK || ''
      };
    });

    // 상단 단건도 첫 건 기준으로 세팅
    Object.assign(dataParams, {
      YEAR: resultList[0].YEAR,
      MAIN_SEQ: resultList[0].MAIN_SEQ,
      DEPT_CD: resultList[0].DEPT_CD,
      VEND_NM: resultList[0].VEND_NM,
      PROVIDE_DT: resultList[0].PROVIDE_DT,
      VEND_FLAG: resultList[0].VEND_FLAG,
      SAVE_YN: resultList[0].SAVE_YN
    });
  } else {
    // 조회 결과 없을 때: 고정 3행 + 빈 12행 구성
    dataParams.provideList = Array.from({ length: 15 }, (_, i) => ({
      SEQ: i + 1,
      PROVIDE_NM: i < 3 ? fixedProvideNames[i] : '',
      REMARK: ''
    }));
    
    dataParams.MAIN_SEQ = searchParams.MAIN_SEQ;
    dataParams.YEAR = searchParams.YEAR;
    dataParams.PROVIDE_DT = '';
    dataParams.SAVE_YN = 'N'
  }
};

const searchData = () => {
  return commonSearchApi({ queryId: 'SPPFG0010_SEARCH_02', param: searchParams })
}


const beforeStorage = () => { 
  const requiredProvideDt = [
    { key: 'PROVIDE_DT', message: '자료제공일자를 선택하세요.' },
  ];

  // 필수 항목 체크 (담당자 없을때)
  for (const field of requiredProvideDt) {
    if (isEmpty(dataParams[field.key])) {
      Message.warn(t(field.message));
      return false;
    }
  }
  return true
}

const saveStorage = () => {
  const saveList = dataParams.provideList
    .filter(item => !!item.PROVIDE_NM) // PROVIDE_NM이 존재하는 항목만
    .map((item, idx) => ({
      ...item,
      SEQ: idx + 1,
      DEPT_CD: dataParams.DEPT_CD,
      VEND_NM: dataParams.VEND_NM,
      PROVIDE_DT: dataParams.PROVIDE_DT,
      YEAR: dataParams.YEAR,
      MAIN_SEQ: dataParams.MAIN_SEQ,
      SAVE_YN: dataParams.SAVE_YN
    }));
  return commonExecuteApi({ queryId : 'SPPFG0010_SAVE_02', list: saveList })
}

const afterStorage = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

// 저장 전
const beforeSave = () => {
  const requiredProvideDt = [
    { key: 'PROVIDE_DT', message: '자료제공일자를 선택하세요.' },
  ];

  for (const field of requiredProvideDt) {
    if (isEmpty(dataParams[field.key])) {
      Message.warn(t(field.message));
      return false;
    }
  }
  return true
}

const saveData = () => {
  const saveList = dataParams.provideList
    .filter(item => !!item.PROVIDE_NM) // PROVIDE_NM이 존재하는 항목만
    .map((item, idx) => ({
      ...item,
      SEQ: idx + 1,
      DEPT_CD: dataParams.DEPT_CD,
      VEND_NM: dataParams.VEND_NM,
      PROVIDE_DT: dataParams.PROVIDE_DT,
      YEAR: dataParams.YEAR,
      MAIN_SEQ: dataParams.MAIN_SEQ,
      SAVE_YN: dataParams.SAVE_YN
    }));
  return commonExecuteApi({ queryId : 'SPPFG0010_SAVE_03', list: saveList })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  initCodeList()
}

watchEffect(() => {
  const saveYn = dataParams.SAVE_YN;
  const vendFlag = dataParams.VEND_FLAG;

  nextTick(() => {
    // 출력 여부: 조건 충족 시에만 true
    const enablePrint =
      saveYn === 'Y' && vendFlag == 'Y';

    // 저장 후에는 저장버튼 disable
    const enableUpdate =
      saveYn === 'Y' && vendFlag == 'Y';
      
    // 임시저장 버튼은 vendFlag가 Y일 때만 disable, 그 외에는 항상 가능
    const enableTemp = vendFlag !== 'Y';

    // 컬럼 수정 가능 여부
    const isReadonly = vendFlag === 'Y';

    menuTitle.value?.disableBtn('btnTemporaryStorage', !enableTemp); // false일 때 활성화
    menuTitle.value?.disableBtn('btnUpdate', enableUpdate);           // false일 때 활성화
    menuTitle.value?.disableBtn('btnPrint', !enablePrint);           // false일 때 활성화
    readOnly.value = isReadonly;
  });
});


// 팝업
const openPopup = (popupParam) => { 
  dialog.value = true
  
  dataParams.BSNS_CD = popupParam.BSNS_CD
  dataParams.DEPT_CD = popupParam.DEPT_CD
  dataParams.VEND_NM = popupParam.VEND_NM
  dataParams.MAIN_SEQ = popupParam.SEQ
  dataParams.YEAR = popupParam.YEAR
  dataParams.VEND_COUNT = popupParam.VEND_COUNT
  
  initCodeList()

  searchParams.MAIN_SEQ = popupParam.SEQ
  searchParams.DEPT_CD = popupParam.DEPT_CD
  searchParams.YEAR = popupParam.YEAR
  getData()
}

const closePopup = () => {
  dialog.value = false
  Object.assign(dataParams, {
    VEND_COUNT: 0,
    VEND_FLAG: '',
  })
  emit('upData')
}

defineExpose({
  openPopup
})


</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    class="p-absolute user-select-none"
    width="1000"
    height="800"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>도급업체자료 제공현황</span>
    </v-sheet>
    <v-card class="pa-3 fill-height" style="background-color: white">
      <!-- 타이틀 -->    
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnPrint', 'btnTemporaryStorage', 'btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
          :hiddenManuel="true"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <table class="table fixed-height-140">
          <tr style="height: 140px;">
            <!-- 1열 -->
            <td class="border center no-padding" style="width: 20%; height: 100%;">
              <img :src="HHI_color_ko" style="max-height: 120px; max-width: 150px;" />
            </td>

            <!-- 2열 -->
            <td class="border" style="width: 60%; height: 100%;">
              <table class="table no-padding" style="height: 100%;">
                <tr style="height: 100%;">
                  <!-- 제목 영역 (7:3 비율) -->
                  <td class="center" style="width: 70%; height: 100%;">
                    <strong>공정안전관리(PSM)<br>도급업체 자료제공현황</strong>
                  </td>

                  <!-- 부서명/도급/일자 (세로 3행) -->
                  <td style="width: 30%; height: 100%;">
                    <table class="table no-padding" style="height: 100%;">
                      <tr style="height: 33.34%;" class="border">
                        <td class="center">부서명</td>
                      </tr>
                      <tr style="height: 33.33%;" class="border">
                        <td class="center">도급업체명(서명)</td>
                      </tr>
                      <tr style="height: 33.33%;" class="border">
                        <td class="center">자료제공일자</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>

            <!-- 3열 -->
            <td class="border" style="width: 20%; height: 100%;">
              <table class="table no-padding" style="height: 100%;">
                <tr style="height: 33.34%;" class="border">
                  <td>
                    <input class="input-full" type="text" :value="getDeptName(dataParams.DEPT_CD)" readonly/>
                  </td>
                </tr>
                <tr style="height: 33.33%;" class="border">
                  <td>
                    <input class="input-full" type="text" v-model="dataParams.VEND_NM" readonly/>
                  </td>
                </tr>
                <tr style="height: 33.33%;" class="border">
                  <td>
                    <input
                      class="input-full"
                      type="date"
                      v-model="dataParams.PROVIDE_DT"
                      :readonly="readOnly"
                    />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr class="row-2 center">
            <td class="border">순</td>
            <td class="border">제공자료명</td>
            <td class="border">비고</td>
          </tr>

          <tr
            v-for="(row, index) in dataParams.provideList"
            :key="index"
            class="row-normal center"
          >
            <td class="border">{{ index + 1 }}</td>

            <td class="border">
              <input
                v-if="index > 2"
                type="text"
                v-model="dataParams.provideList[index].PROVIDE_NM"
                class="table-input"
                :readonly="readOnly"
              />
              <span v-else>{{ dataParams.provideList[index].PROVIDE_NM }}</span>
            </td>

            <td class="border">
              <input
                type="text"
                v-model="dataParams.provideList[index].REMARK"
                class="table-input"
                :readonly="readOnly"
              />
            </td>
          </tr>
        </table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (405px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    // min-height: 700px;
  }
}
.border {
  border: 1px solid black;
}

.border3 {
  border-bottom: 1px solid black;
  border-top: 1px solid black;
  border-left: 1px solid black;
}
.table {
  border-collapse: collapse;
  width: 100%;
  height: 100%;
  table-layout: fixed;
}
.no-padding {
  padding: 0 !important;
}

.fixed-height-140 {
  height: 140px;
}
.row-1 {
  height: 120px;
}
.row-2 {
  height: 40px;
  background-color: #f0f4f8;
}
.row-normal {
  height: 50px;
}
.gray {
  background-color: #f0f4f8;
}
.center {
  text-align: center;
  vertical-align: middle;
}

.input-full {
  width: 90%;
  height: 100%;
  box-sizing: border-box;
  border: none;
  text-align: left;
  margin-left: 10px;
}

.table-input {
  width: 100%;
  border: none;
  padding: 4px;
  box-sizing: border-box;
  text-align: center;
}
.table-input:focus {
  outline: none;
}

</style>