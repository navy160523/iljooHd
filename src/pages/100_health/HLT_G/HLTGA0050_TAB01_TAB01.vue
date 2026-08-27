<!-- 
  화면명 : 특수검진 유해인자
  화면개요 : 특수검진 유해인자 TAB01
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import ILabel from "@/components/ILabel.vue"
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)
const emit = defineEmits(['create'])
// 조회조건
const searchParams = reactive({
  CMPNY_DIV: '',
  HALF_DIV: '',
  YEAR: '',
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // 화학물질관리자 : HLTD001, 보건총괄: GRP00372, HSE추진자: GRP00392
  // if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTD001') || 
  //   userStore.authGrpCd.includes('GRP00372') || userStore.authGrpCd.includes('GRP00392')) isAdmin.value = true 

  // onButtonsClick({ id: 'btnSearch' })
  
  grdMain.value.getGridView().rowHeight = -1
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }},
  keys : [],
  fields : [ 

    { fieldName: 'DEPT_NM', width: '60', dataType: 'text', styleName: 'left-column', editable: false, header: { text: t('부서명') } },
    { fieldName: 'PROCESS_NM', width: '60', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('공정명') } },
    { fieldName: 'CASNM_KOR', width: '140', editable: false, styleName: 'left-column multiline-editor', dataType: 'text', header: { text: t('특검 유해인자') } },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기구분') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
    { fieldName: 'FROM_DEPT_CD', dataType: 'text', header: { text: t('부서코드') },visible: false, },
    { fieldName: 'PROCESS_CD', dataType: 'text', header: { text: t('공정코드') },visible: false, },
    { fieldName: 'CASNO', dataType: 'text', header: { text: t('CASNO') },visible: false, },
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
    getData()
  } else if (btn.id === 'btnCreate') {
    emit('create')
  } 
}

const getData = (param) => {
  if(!isEmpty(param)) {
    searchParams.CMPNY_DIV = param.CMPNY_DIV
    searchParams.HALF_DIV = param.HALF_DIV
    searchParams.YEAR = param.YEAR
  }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(false)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTGA0050_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  // 중복 제거
  for(let i = 0; i < res.ORESULT_CUR.length; i++) {
    let casno = res.ORESULT_CUR[i].CASNO
    let korNm = res.ORESULT_CUR[i].CASNM_KOR
    // null 이면 다음으로
    if(!isEmpty(korNm)) {
      const uniqueItems = [...new Set(
        korNm.split(',').map(item => item.trim())
      )]
      res.ORESULT_CUR[i].CASNM_KOR = uniqueItems.join(', ')
    }
    if(!isEmpty(casno)) {
      const uniqueItems = [...new Set(
        casno.split(',').map(item => item.trim())
      )]
      res.ORESULT_CUR[i].CASNO = uniqueItems.join(', ')
    }
  }
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 체크박스 클릭
const onItemCheckedMain = (grid, itemIndex, checked) => {
  const dataProvider = grdMain.value.getDataProvider()
  const gridView = grdMain.value.getGridView()
  const targetIndex = gridView.getDataRow(itemIndex)
  const data = dataProvider.getJsonRow(targetIndex)

  // 전체 데이터 한 번만 로드
  const allRows = dataProvider.getJsonRows(0, -1)

  // 고유 비교 키 생성 함수
  const makeKey = (row) =>
    `${row.MATNO}__${row.MATDSC}__${row.VNDNME}`

  // 기준 키 미리 생성
  const targetKey = makeKey(data)

  allRows.forEach((row, i) => {
    if (i === targetIndex) return

    if (makeKey(row) === targetKey) {
      gridView.checkRow(i, checked, false, false)
    }
  })
}

const getCheckData = () => {
  let result = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    result.push(data)
  }
  return result
}

defineExpose({
  getData,
  getCheckData
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <div class="content-area">
      <RealGrid
        ref="grdMain"
        style="height: 100%;"
        :grid-view-option="grd1Props.gridViewOption"
        :keys="grd1Props.keys" 
        :fields="grd1Props.fields"
        :columns="grd1Props.columns"
      />
    </div>
  </v-card>
</template>
  
<style scoped lang="scss">

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px - 230px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>