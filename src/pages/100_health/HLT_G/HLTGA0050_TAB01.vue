<!-- 
  화면명 : 특수검진 유해인자
  화면개요 : 특수검진 유해인자 TAB01
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from "@/components/ILabel.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import TAB01 from '@/pages/100_health/HLT_G/HLTGA0050_TAB01_TAB01.vue'
import TAB02 from '@/pages/100_health/HLT_G/HLTGA0050_TAB01_TAB02.vue'
import TAB03 from '@/pages/100_health/HLT_G/HLTGA0050_TAB01_TAB03.vue'
import HLTGA0050Popup01 from '@/pages/100_health/HLT_G/HLTGA0050_TAB01_Popup01.vue'
import HLTGA0050Popup02 from '@/pages/100_health/HLT_G/HLTGA0050_TAB01_Popup02.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const isAdmin = ref(false)

const tab = ref('tab01')
const tab01 = ref(null)
const tab02 = ref(null)
const tab03 = ref(null)
const hltga0050Popup01 = ref(null)
const hltga0050Popup02 = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const grdData = ref([])

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  HALF_DIV: 'HI',
  YEAR: String(dayjs().get('year')),
  JOB_GRP_ID: []
})

const codeList = reactive({
  YEAR:[],
  HALF_DIV: [],
  JOB_GRP_NM: []
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // 화학물질관리자 : HLTD001, 보건총괄: GRP00372, HSE추진자: GRP00392
  // if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTD001') || 
  //   userStore.authGrpCd.includes('GRP00372') || userStore.authGrpCd.includes('GRP00392')) isAdmin.value = true 

  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }
  Promise.all([
    // 상하반기
    getCodeList('HHII800'),
    // 콤보박스 조회
    commonSearchApi({ queryId: 'HLTGA0050_SEARCH_COMBO', param: { CMPNY_DIV: searchParams.CMPNY_DIV } }),
  ]).then((res) => {
    codeList.HALF_DIV = res[0].ORESULT_CUR
    codeList.JOB_GRP_NM = res[1].ORESULT_CUR
    codeList.JOB_GRP_NM.unshift({ COD: '0', TXT: '전체'})
    searchParams.JOB_GRP_ID = ['0']
  })
  // onButtonsClick({ id: 'btnSearch' })
  
  grdMain.value.getGridView().filterPanel.visible = true
})

const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 

    { fieldName: 'DEPTNM', width: '80', dataType: 'text', styleName:'left-column', editable: false, header: { text: t('부서') } },
    { fieldName: 'JOB_GRP_NM', width: '80', dataType: 'text', editable: false, header: { text: t('직계') } },
    { fieldName: 'DUTY_NM', width: '80', dataType: 'text', styleName:'left-column', editable: false, header: { text: t('직무') } },
    { fieldName: 'CNT', width: '40', dataType: 'text', styleName:'right-column', editable: false, header: { text: t('인원') } },
    { fieldName: 'CASNM_KOR', width: '120', dataType: 'text', styleName: 'left-column multiline-editor', editable: false, header: { text: t('특검 유해인자') } },
    { fieldName: 'ETC1', width: '50', dataType: 'text', editable: false, header: { text: t('예비조사') } },
    { fieldName: 'ETC2', width: '50', dataType: 'text', editable: false, header: { text: t('측정결과') } },
    { fieldName: 'ETC3', width: '50', dataType: 'text', editable: false, header: { text: t('부서 규제물질') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기구분') },visible: false, },
    { fieldName: 'JOB_GRP_ID', dataType: 'text', header: { text: t('직계코드') },visible: false, },
    { fieldName: 'DUTY_CD', dataType: 'text', header: { text: t('직무코드') },visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})
grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  // if(!isAdmin.value) {
  //   return Message.warn(t('관리자만 사용가능합니다.'))
  // }
  
  if (btn.id === 'btnSearch') {

    leftGridData()
    getData()
  } else if (btn.id === 'btnApplicate') {
    
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    let check1 = []
    let checkList1 = []
    let checkList2 = []
    let gubun = 'A'
    let saveParams = []
    if(tab.value == 'tab01') {
      check1 = tab01.value.getCheckData()
      gubun = 'A'
    } else if (tab.value == 'tab02') {
      check1 = tab02.value.getCheckData()
      gubun = 'B'
    } else if (tab.value == 'tab03') {
      check1 = tab03.value.getCheckData()
      gubun = 'C'
    }

    if(isEmpty(check1)) {
      return Message.warn('왼쪽 그리드에 한 개 이상의 데이터를 선택하십시오.')
    } else if(isEmpty(checkedRows)) {
      return Message.warn('오른쪽 그리드에 한 개 이상의 데이터를 선택하십시오.')
    }

    checkList1 = check1.flatMap(item => {
      let casno = item.CASNO
      const casnos = casno?.split(',').map(c => c.trim()) || [''];
      return casnos.map(casno => ({
        ...item,
        CASNO: casno,
        GUBUN: gubun,
        PRC_MAT_CD: gubun == 'C' ? item.MATNO : item.PROCESS_CD
      }))
    })

    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      checkList2.push(data)
    }
    const result = checkList1.flatMap(chk1 =>
      checkList2.map(chk2 => ({
        ...chk1,
        ...chk2
      }))
    )
    for(let r of result) {
      if(isEmpty(r.CASNO)) {
        continue
      }
      r.HALF_DIV = searchParams.HALF_DIV
      saveParams.push(r)
    }
    // 특검 유해인자가 없을 시 return
    if(isEmpty(saveParams)) {
      return Message.warn(t('저장할 특검 유해인자가 없습니다.'))
    }
    vm.$swal({ title: t('추가하시겠습니까?'), showCancelButton: true }).then(res => {
      if (res.isConfirmed) {
        return commonExecuteApi({ queryId : 'HLTGA0050_SAVE_01', list: saveParams }).then(res => {
          Message.success(t('성공적으로 저장되었습니다.'))
          onButtonsClick({id: 'btnSearch'})
        })
      }
    })
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnAddEtc') {
    let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
    let params =[]
    if(isEmpty(checkedRows)) {
      return Message.warn('하나 이상의 데이터를 선택하여 주십시오.')
    }

    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      data.HALF_DIV = searchParams.HALF_DIV
      data.GUBUN = 'D'
      data.FROM_DEPT_CD = data.DEPT_CD
      params.push(data)
    }

    hltga0050Popup01.value.openPopup(params)
  }
}

const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  // let param = _.cloneDeep(searchParams)
  // if(isEmpty(searchParams.JOB_GRP_ID)) {
  //   param.JOB_GRP_ID = "'''" + codeList.JOB_GRP_NM.map(item => item.COD).join("'', ''") + "'''" 
  // } else {
  //   param.JOB_GRP_ID = "'" + searchParams.JOB_GRP_ID.join("', '") + "'"
  // }
  return commonSearchApi({ queryId: 'HLTGA0050_SEARCH_04', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {

  // 중복 제거
  for(let i = 0; i < res.ORESULT_CUR.length; i++) {
    let korNm = res.ORESULT_CUR[i].CASNM_KOR
    // null 이면 다음으로
    if(isEmpty(korNm)) {
      continue
    }
    const uniqueItems = [...new Set(
      korNm.split(',').map(item => item.trim())
    )]
    res.ORESULT_CUR[i].CASNM_KOR = uniqueItems.join(', ')
  }

  grdData.value = res.ORESULT_CUR
  if(!isEmpty(searchParams.JOB_GRP_ID.filter(item => item == '0'))) {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)  
  } else {
    grdMain.value.getDataProvider().setRows(gridData(res.ORESULT_CUR))
  }
}

const gridData = (data) => {
  return data.filter(item => searchParams.JOB_GRP_ID.includes(item.JOB_GRP_ID))
}

const leftGridData = () => {

  if (tab01.value != null) {
    tab01.value.getData(searchParams)
  }
  if (tab02.value != null) {
    tab02.value.getData(searchParams)
  } 
  if (tab03.value != null) {
    tab03.value.getData(searchParams)
  }
}

const deleteData = () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    saveParams.push(data) 
  }
  
  return commonExecuteApi({ queryId : 'HLTGA0050_DELETE_01', list: saveParams })
} 

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

//  그리드 이벤트
const onCellDblClickedMain = (grd, data) => {
  if (data.cellType === 'data') {
    let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
    row.HALF_DIV = searchParams.HALF_DIV
    hltga0050Popup02.value.openPopup(row)
  }
}

// 체크박스 클릭
const onItemChecked = (grid, itemIndex, checked) => {
  
}

watch(() => [searchParams.YEAR, searchParams.HALF_DIV], (newValue, oldValue) => {
  onButtonsClick({id: 'btnSearch'})
})

// watch(() => [tab.value], (newValue, oldValue) => {
//   leftGridData()
// })

watch(() => searchParams.JOB_GRP_ID, (newValue, oldValue) => {
  let selectCode = newValue.find(item => !oldValue.includes(item))

  if(selectCode == '0') {
    searchParams.JOB_GRP_ID = ['0']
    grdMain.value.getDataProvider().setRows([])
    grdMain.value.getDataProvider().setRows(grdData.value)
    return 
  } else if (!isEmpty(selectCode)) {
    searchParams.JOB_GRP_ID = newValue.filter(item => item != '0')
  } else if (newValue.length == 1 && newValue[0] == '0') {
    grdMain.value.getDataProvider().setRows([])
    grdMain.value.getDataProvider().setRows(grdData.value)
    return
  }

  grdMain.value.getDataProvider().setRows([])
  grdMain.value.getDataProvider().setRows(gridData(grdData.value))
})

// 탭 레퍼런스가 할당될 때마다 searchData를 실행
// watch([tab01], ([tab01Value]) => {
//   if(isEmpty(searchParams.CMPNY_DIV) || isEmpty(searchParams.YEAR) ||isEmpty(searchParams.HALF_DIV)) return
//   if(tab01Value == null) return
//   tab01.value.getData(searchParams)
// })

// watch([tab02], ([tab02Value]) => {
//   if(isEmpty(searchParams.CMPNY_DIV) || isEmpty(searchParams.YEAR) ||isEmpty(searchParams.HALF_DIV)) return
//   if(tab02Value == null) return
//   tab02.value.getData(searchParams)
// })

// watch([tab03], ([tab03Value]) => {
//   if(isEmpty(searchParams.CMPNY_DIV) || isEmpty(searchParams.YEAR) ||isEmpty(searchParams.HALF_DIV)) return
//   if(tab03Value == null) return
//   tab03.value.getData(searchParams)
// })

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.YEAR"
            :label="$t('해당년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            v-model="searchParams.HALF_DIV"
            :label="$t('반기구분')"
            label-width="50px"
            :items="codeList.HALF_DIV"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-select
            v-model="searchParams.JOB_GRP_ID"
            :label="$t('직계')"
            label-width="50px"
            :items="codeList.JOB_GRP_NM"
            item-value="COD"
            item-title="TXT" 
            width="500px"
            multiple
          />
        </v-sheet>
        <div class="h-grow">
          <v-sheet class="h-auto" width="50%">
            <v-sheet class="mb-2">
              <!-- 탭 -->
              <VTabs v-model="tab">
                <VTab value="tab01"> 작업환경측정 예비조사 현황 </VTab>
                <VTab value="tab02"> 작업환경측정 결과 현황 </VTab>
                <VTab value="tab03"> 부서 규제물질 관리 현황 </VTab>
              </VTabs>
            </v-sheet>
            <!-- 탭 화면-->
            <VWindow v-model="tab" class="fill-height">
              <VWindowItem value="tab01" class="fill-height" eager> 
                <TAB01 ref="tab01"/>
              </VWindowItem>
              <VWindowItem value="tab02" class="fill-height" eager>
                <TAB02 ref="tab02"/>
              </VWindowItem>
              <VWindowItem value="tab03" class="fill-height" eager>
                <TAB03 ref="tab03"/>
              </VWindowItem>
            </VWindow>
          </v-sheet>
          <v-sheet class="h-auto ml-2" width="50%">
            <IGridTitle
              :title="(t('부서/직무 특수검진 유해인자 현황'))"
              :button-list="['btnApplicate','btnAddEtc', 'btnDelete']"
              @click-button="onButtonsClick"
            ></IGridTitle>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grd1Props.gridViewOption"
              :keys="grd1Props.keys" 
              :fields="grd1Props.fields"
              :columns="grd1Props.columns"
              @onItemChecked="onItemChecked"
              @onCellDblClicked="onCellDblClickedMain"
            />
          </v-sheet>
        </div>
      </div>
      <!-- 팝업존 -->
    </v-card-text>
    <HLTGA0050Popup01 ref="hltga0050Popup01" @after-search="getData"/>
    <HLTGA0050Popup02 ref="hltga0050Popup02" @after-search="getData"/>
  </v-card>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 110px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

.v-tab {
  width: 180px;
}
</style>