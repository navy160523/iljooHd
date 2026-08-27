<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty, isEmptyArray } from '@/@core/utils'
import Message from '@hiway/utils/notify'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  chatbotTranslateLn,
} from '@hiway/api/commonApi'
import RealGrid from 'realgrid'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import TAB01_1 from '@/pages/100_health/HLT_H/HLTHD0010Tab01_1.vue'
import TAB01_2 from '@/pages/100_health/HLT_H/HLTHD0010Tab01_2.vue'
import TAB01_3 from '@/pages/100_health/HLT_H/HLTHD0010Tab01_3.vue'

defineOptions({
  name: '100_health-HLT_H-HLTHD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const queryId = ref(null)

// 탭 상태
const mainTab = ref('tab01')
const subTab = reactive({
  tab01: 'tab01_1',
  tab02: 'tab02_1',
})
// 탭 참조객체
const tab01_1 = ref(null)
const tab01_2 = ref(null)
const tab01_3 = ref(null)
const tab02_1 = ref(null)
const tab02_2 = ref(null)
const tab02_3 = ref(null)
const subRefs = reactive({
  tab01_1: tab01_1,
  tab01_2: tab01_2,
  tab01_3: tab01_3,
  tab02_1: tab02_1,
  tab02_2: tab02_2,
  tab02_3: tab02_3,
})

// 반응형 버튼
const buttons = ref(['btnSearch', 'btnDelete', 'btnUpdate', 'btnPrint', 'btnModify'])
onMounted(() => {
  // 렌더링 시 첫 조회
  onButtonsClick({ id: 'btnSearch' })

  // 탭별 버튼 변경
  watch(
    mainTab,
    (tab) => {
      console.log('tab', tab)
      if (tab === 'tab01') {
        buttons.value = ['btnSearch', 'btnUpdate']
      } else if (tab === 'tab02') {
        buttons.value = ['btnSearch', 'btnDelete', 'btnPrint', 'btnModify']
        console.log('buttons.value', buttons.value)
      }
    },
    { immediate: true }
  )
})

// 탭 이동 시 조회
watch([mainTab, subTab], () => {
  onButtonsClick({ id: 'btnSearch' })
})

// 버튼 이벤트
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setBefore(beforeSearch).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  } else if (btn.id === 'btnPrint') {
    onExceldown()
  } else if (btn.id === 'btnModify') {
    new saveFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete02).setQuery(deleteData02).setAfter(afterDelete02).run()
  }
}

//삭제관련 로직 시작
const beforeDelete02 = () => {
  const checkedRows = subRefs[subTab[mainTab.value]].getGridView().getCheckedRows()
  if (checkedRows.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))
    return false
  }
  if (subTab[mainTab.value] === 'tab02_1') {
    queryId.value = 'HLTHD0010_DELETE_04'
  } else if (subTab[mainTab.value] === 'tab02_2') {
    queryId.value = 'HLTHD0010_DELETE_05'
  } else {
    queryId.value = 'HLTHD0010_DELETE_06'
  }
  return true
}
const deleteData02 = () => {
  let deleteParam = []
  const checkedRows = subRefs[subTab[mainTab.value]].getGridView().getCheckedRows()
  for (let i = 0; i < checkedRows.length; i++) {
    let data = subRefs[subTab[mainTab.value]].getDataProvider().getJsonRow(checkedRows[i])
    if (subTab[mainTab.value] === 'tab02_1') {
      let deleteData = {
        DEDUCTION_DATE: data.DEDUCTION_DATE,
        DEPT_CD: data.DEPT_CD,
        RECEIVE_ASGN_CD: data.RECEIVE_ASGN_CD,
        RETIRE_ASGN_CD: data.VEND_CD,
        EMP_NO: data.EMP_NO,
        RECEIVE_DT: data.RECEIVE_DT,
      }
      deleteParam.push(deleteData)
    } else if (subTab[mainTab.value] === 'tab02_2') {
      let deleteData = {
        DEDUCTION_DATE: data.DEDUCTION_DATE,
        DEPT_CD: data.DEPT_CD,
        RECEIVE_ASGN_CD: data.RECEIVE_ASGN_CD,
        RETIRE_ASGN_CD: data.VEND_CD,
        EMP_NM: data.ENTER_NAME,
        RECEIVE_DT: data.RECEIVE_DT,
      }
      deleteParam.push(deleteData)
    } else {
      let deleteData = {
        DEDUCTION_DATE: data.DEDUCTION_DATE,
        DEPT_CD: data.DEPT_CD,
        ASGN_CD: data.ASGN_CD,
        RETIRE_ASGN_CD: data.VEND_CD,
        EMP_NO: data.EMP_NO,
        RECEIVE_DT: data.RECEIVE_DT,
      }
      deleteParam.push(deleteData)
    }
  }
  return commonExecuteApi({
    queryId: queryId.value,
    list: deleteParam,
  })
}
const afterDelete02 = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝
const beforeDelete = () => {
  saveParams.length = 0
  const checkedRows = subRefs[subTab[mainTab.value]].getGridView().getCheckedRows()

  if (isEmptyArray(checkedRows)) {
    return Message.warn(t('수정할 데이터가 없습니다.'))
  }

  const checkedData = []
  checkedRows.forEach((rowIdx) => {
    const data = subRefs[subTab[mainTab.value]].getDataProvider().getJsonRow(rowIdx)
    checkedData.push(data)
  })

  if (subTab[mainTab.value] === 'tab02_1') {
    queryId.value = 'HLTHD0010_DELETE_01'
  } else if (subTab[mainTab.value] === 'tab02_2') {
    queryId.value = 'HLTHD0010_DELETE_02'
  } else if (subTab[mainTab.value] === 'tab02_3') {
    queryId.value = 'HLTHD0010_DELETE_03'
  }

  Object.assign(saveParams, checkedData)
  return true
}

const deleteData = () =>
  commonExecuteApi({
    queryId: queryId.value,
    list: saveParams,
  })

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

// 엑셀 다운로드
const onExceldown = async () => {
  const gridView = subRefs[subTab[mainTab.value]].getGridView()
  const dataProvider = subRefs[subTab[mainTab.value]].getDataProvider()

  // 미공제 데이터 인덱스 수집
  const hideIdx = []
  dataProvider.getJsonRows().forEach((el, idx) => {
    if (el['USE_YN'] === 'N') {
      hideIdx.push(idx)
    }
  })

  // 출력하지 않을 데이터(미공제 데이터) 숨기기
  dataProvider.hideRows(hideIdx)

  // 수정 여부 검사
  if (!isEmptyArray(dataProvider.getAllStateRows().updated)) {
    Message.warn(t('수정 중인 데이터가 있습니다.'))
    return dataProvider.showHiddenRows(hideIdx) // 숨김 처리 해제
  }
  // 출력 데이터 검사
  if (gridView.getItemCount(true) < 1) {
    Message.warn(t('출력할 데이터가 없습니다.'))
    return dataProvider.showHiddenRows(hideIdx) // 숨김 처리 해제
  }

  // 엑셀 출력
  const tabName = {
    tab02_1: '안전화',
    tab02_2: '안전장화',
    tab02_3: '도수보안경',
  }
  gridView.exportGrid({
    type: 'excel',
    target: 'local',
    lookupDisplay: true,
    fileName:
      `안전보호구_기성공제 이력(${t(tabName[subTab[mainTab.value]])})_` + dayjs(new Date()).format('YYYY-MM') + '.xlsx', // 저장될 파일 name
    progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
    indicator: 'hidden', // indidator 영역 표시
    header: 'visible', // 헤더 표시
    footer: 'visible', // footer 표시하지 않음
    allColumns: false, // visible : false 인 행도 표시할 것인지 여부
    done: () => {
      // 내보내기 완료 후 실행되는 함수
      Message.success(t('엑셀 다운로드가 완료되었습니다.'))
    },
  })

  // 숨김 처리 해제
  dataProvider.showHiddenRows(hideIdx)
}

const saveParams = reactive([])

const beforeSave = () => {
  saveParams.length = 0
  const saveData = subRefs[subTab[mainTab.value]].getDataProvider().getJsonRows()

  if (isEmptyArray(saveData)) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  if (subTab[mainTab.value] === 'tab01_1') {
    queryId.value = 'HLTHD0010_SAVE_01'
  } else if (subTab[mainTab.value] === 'tab01_2') {
    queryId.value = 'HLTHD0010_SAVE_02'
  } else if (subTab[mainTab.value] === 'tab01_3') {
    queryId.value = 'HLTHD0010_SAVE_03'
  }

  Object.assign(saveParams, saveData)
  return true
}
const saveData = () =>
  commonExecuteApi({
    queryId: queryId.value,
    list: saveParams,
  })
const afterSave = async () => {
  subRefs[subTab[mainTab.value]].getDataProvider().setRows([])
  // 저장 성공 시 조회 탭으로 바로가기
  Object.assign(subTab, { tab02: 'tab02' + subTab[mainTab.value].substring(5, 7) })
  mainTab.value = 'tab02'
}

const codeList = {
  USE_YN: [
    { COD: '', TXT: '전체' },
    { COD: 'Y', TXT: '공제' },
    { COD: 'N', TXT: '미공제' },
  ],
}

// 조회
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DEDUCTION_MONTH_FROM: dayjs().subtract(3, 'M').format('YYYY-MM'),
  DEDUCTION_MONTH_TO: dayjs().format('YYYY-MM'),
  DEDUCTION_DATE: dayjs().format('YYYY-MM-DD'),
  USE_YN: '',
})

const beforeSearch = () => {
  queryId.value = ''
  if (subTab[mainTab.value] === 'tab01_1') {
    queryId.value = 'HLTHD0010_SEARCH_01'
  } else if (subTab[mainTab.value] === 'tab01_2') {
    queryId.value = 'HLTHD0010_SEARCH_02'
  } else if (subTab[mainTab.value] === 'tab01_3') {
    queryId.value = 'HLTHD0010_SEARCH_03'
  } else if (subTab[mainTab.value] === 'tab02_1') {
    queryId.value = 'HLTHD0010_SEARCH_04'
  } else if (subTab[mainTab.value] === 'tab02_2') {
    queryId.value = 'HLTHD0010_SEARCH_05'
  } else if (subTab[mainTab.value] === 'tab02_3') {
    queryId.value = 'HLTHD0010_SEARCH_06'
  }

  return true
}
const searchData = () =>
  commonSearchApi({
    queryId: queryId.value,
    param: searchParams,
  })
const afterSearch = (res) => {
  subRefs[subTab[mainTab.value]].getDataProvider().setRows(res.ORESULT_CUR)
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="`${$t(useLogsStore().menuId)}`"
        :button-list="buttons"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex flex-column">
            <div v-if="mainTab === 'tab01'" class="pb-1 d-flex flex-gap">
              <i-input
                :label="$t('공제일자')"
                v-model="searchParams.DEDUCTION_DATE"
                type="date"
                labelWidth="50px"
                width="196px"
                margin="10px"
              />
            </div>
            <div v-else class="pb-1 d-flex flex-gap">
              <i-input
                :label="$t('공제년월')"
                v-model="searchParams.DEDUCTION_MONTH_FROM"
                type="MONTH"
                width="192px"
                margin="10px"
              />
              <i-input
                :label="$t('~')"
                v-model="searchParams.DEDUCTION_MONTH_TO"
                type="MONTH"
                width="152px"
                margin="10px"
              />
              <i-select
                :label="$t('공제여부')"
                labelWidth="60px"
                v-model="searchParams.USE_YN"
                :items="codeList.USE_YN"
                item-value="COD"
                item-title="TXT"
                width="240px"
              />
            </div>
          </div>
        </v-sheet>
        <v-sheet>
          <v-tabs v-model="mainTab">
            <v-tab value="tab01" text="산출" />
            <v-tab value="tab02" text="공제이력" />
          </v-tabs>
          <v-window v-model="mainTab" class="h-window">
            <v-window-item :value="mainTab">
              <v-tabs v-model="subTab[mainTab]">
                <v-tab :value="`${mainTab}_1`" text="안전화" />
                <v-tab :value="`${mainTab}_2`" text="안전장화" />
                <v-tab :value="`${mainTab}_3`" text="도수보안경" />
              </v-tabs>

              <VWindow v-model="subTab[mainTab]">
                <VWindowItem value="tab01_1">
                  <TAB01_1 ref="tab01_1" />
                </VWindowItem>
                <VWindowItem value="tab01_2">
                  <TAB01_2 ref="tab01_2" />
                </VWindowItem>
                <VWindowItem value="tab01_3">
                  <TAB01_3 ref="tab01_3" />
                </VWindowItem>
                <VWindowItem value="tab02_1">
                  <TAB01_1 ref="tab02_1" :tab-value="mainTab" />
                </VWindowItem>
                <VWindowItem value="tab02_2">
                  <TAB01_2 ref="tab02_2" :tab-value="mainTab" />
                </VWindowItem>
                <VWindowItem value="tab02_3">
                  <TAB01_3 ref="tab02_3" :tab-value="mainTab" />
                </VWindowItem>
              </VWindow>
            </v-window-item>
          </v-window>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
/* .content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
} */
</style>
