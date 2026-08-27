<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, getCodeList, } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { useUserStore } from '@hiway/stores/user'
import { useTagsStore } from '@hiway/stores/tags'
import { useRouter } from 'vue-router'
import _ from 'lodash'
import Message from '@hiway/utils/notify'

defineOptions({
  name:'30_safety-SAF_B-SAFBC0030Tab2',
})

const vm = getCurrentInstance().proxy
const t = useI18n().t
const userStore = useUserStore()
const tagsStore = useTagsStore()
const router = useRouter() 
const grdMain = ref(null)

const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    edit: { editable: false },
    checkBar: { visible: true, },
  },
  fields: [
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속'), }, mergeRule: { criteria: "values['ASGN_NM']" }, styleName: 'left-column', width: '250', },
    { fieldName: 'USER_DIV_NM', dataType: 'text', header: { text: t('구분'), }, mergeRule: { criteria: "values['ASGN_NM'] + values['USER_DIV_NM']" }, width: '80', },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위'), }, width: '80', },
    { fieldName: 'OFFI_RES_NM', dataType: 'text', header: { text: t('직책'), }, width: '80', },
    { fieldName: 'CHK_GRP_NM', dataType: 'text', header: { text: t('점검그룹'), }, width: '80', },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번'), }, width: '80', },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명'), }, width: '80', },
    { fieldName: 'TOTAL_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('계'), styleName: 'multiline-editor' }, styleName: 'right-column cursor-pointer', width: '50', },
    { fieldName: 'OK_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('양호'), styleName: 'multiline-editor' }, styleName: 'right-column cursor-pointer', width: '50', },
    { fieldName: 'BAD_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('불량'), styleName: 'multiline-editor' }, styleName: 'right-column cursor-pointer', width: '50', },
    { fieldName: 'TYP_A_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('모바일작업지시\n(PTW연계)'), styleName: 'multiline-editor' }, styleName: 'right-column cursor-pointer', width: '110', },
    { fieldName: 'TYP_B_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('PTW\n(단기공사)'), styleName: 'multiline-editor' }, styleName: 'right-column cursor-pointer', width: '80', },
    { fieldName: 'TYP_C_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('PTW\n(출력QR)'), styleName: 'multiline-editor' }, styleName: 'right-column cursor-pointer', width: '80', },
    { fieldName: 'TYP_D_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('PTW\n(특수선)'), styleName: 'multiline-editor' }, styleName: 'right-column cursor-pointer', width: '80', },
    { fieldName: 'TYP_E_CNT', dataType: 'number', numberFormat: '#,##0', header: { text: t('엔진\n고위험'), styleName: 'multiline-editor' }, styleName: 'right-column cursor-pointer', width: '65', },
    
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('CMPNY_DIV'), }, visible: false, },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('BSNS_CD'), }, visible: false, },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('DEPT_CD'), }, visible: false, },
    { fieldName: 'ASGN_CD', dataType: 'text', header: { text: t('ASGN_CD'), }, visible: false, },
  ],
  columns: [],
  columnLayout: [
    'ASGN_NM',
    'USER_DIV_NM',
    'JOB_TIT_NM',
    'OFFI_RES_NM',
    'CHK_GRP_NM',
    'EMP_NO',
    'EMP_NM',
    {
      name: '고위험작업 점검 실적',
      direction: 'horizontal',
      items: [
        'TOTAL_CNT',
        'OK_CNT',
        'BAD_CNT',
      ],
    },
    {
      name: '점검유형별 점검 실적',
      direction: 'horizontal',
      items: [
        'TYP_A_CNT',
        'TYP_B_CNT',
        'TYP_C_CNT',
        'TYP_D_CNT',
        'TYP_E_CNT',
      ],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

const readOnlyValue = reactive({
  ASGN_CD: false,
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  FROM_DT: dayjs().format('YYYY-MM-DD'),
  TO_DT: dayjs().format('YYYY-MM-DD'),
  HOLI_YN: 'Y',
  SHIP_NO: '',
  DN_DIV: '',
  THR_YN: 'Y',
  BSNS_CD: userStore.bsnsCd,
  PART_CD: '',
  DAMD_CD: '',
  DEPT_CD: userStore.deptCd,
  ASGN_YN: 'Y',
  ASGN_CD: '',
})

const codeList = reactive({
  SHIP_NO: [],
  DN_DIV: [
    { TXT: '전체', COD: '' },
    { TXT: '주간', COD: 'D' },
    { TXT: '야간', COD: 'N' },
  ],
  BSNS_CD: [],
  PART_CD: [],
  DAMD_CD: [],
  DEPT_CD: [],
  ASGN_CD: [],
})

const searchCodeList = async () => {
  await Promise.all([
  commonSearchApi({ queryId: 'SAFCD0010_SEARCH81', param: {} }),
  ]).then(res => {
    codeList.SHIP_NO = res[0].ORESULT_CUR
    codeList.SHIP_NO.unshift({ TXT: '전체', COD: '' })
  })
}

const searchBsnsCd = () => {
  commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: searchParams.CMPNY_DIV, USE_DIV: 'N', }, }).then(res => {
    codeList.BSNS_CD = res.ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_CD: '', BSNS_NM: '전체' })
  })
}

const searchPartCd = async (init = true) => {
  await commonSearchApi({
    queryId: 'SAFBC0030_SEARCH_PART',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: searchParams.BSNS_CD,
    },
  }).then(res => {
    codeList.PART_CD = res.ORESULT_CUR
    codeList.PART_CD.unshift({ PART_CD: '', PART_NM: '전체' })

    if(init) {
      searchParams.PART_CD = ''
    }
  })
}

const searchDamdCd = async (init = true) => {
  await commonSearchApi({
    queryId: 'SAFBC0030_SEARCH_DAMD',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: searchParams.BSNS_CD,
      PART_CD: searchParams.PART_CD,
    },
  }).then(res => {
    codeList.DAMD_CD = res.ORESULT_CUR
    codeList.DAMD_CD.unshift({ DAMD_CD: '', DAMD_NM: '전체' })

    if(init) {
      searchParams.DAMD_CD = ''
    }
  })
}

const searchDeptCd = async (init = true) => {
  await commonSearchApi({
    queryId: 'SAFBC0030_SEARCH_DEPT',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: searchParams.BSNS_CD,
      PART_CD: searchParams.PART_CD,
      DAMD_CD: searchParams.DAMD_CD,
    },
  }).then(res => {
    codeList.DEPT_CD = res.ORESULT_CUR
    codeList.DEPT_CD.unshift({ DEPT_CD: '', DEPT_NM: '전체' })

    if(init) {
      searchParams.DEPT_CD = ''
    }
  })
}

const searchAsgnCd = async (init = true) => {
  await commonSearchApi({
    queryId: 'SAFBC0030_SEARCH_ASGN',
    param: {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      BSNS_CD: searchParams.BSNS_CD,
      PART_CD: searchParams.PART_CD,
      DAMD_CD: searchParams.DAMD_CD,
      DEPT_CD: searchParams.DEPT_CD,
    },
  }).then(res => {
    codeList.ASGN_CD = res.ORESULT_CUR
    codeList.ASGN_CD.unshift({ ASGN_CD: '', ASGN_NM: '전체' })

    if(init) {
      searchParams.ASGN_CD = ''
    }
  })
}

const searchData = () => {
  grdMain.value.getDataProvider().setRows([])
  return commonSearchApi({ queryId: 'SAFBC0030_SEARCH_02', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if(btn.id === 'btnPrint') {
    if(grdMain.value.getGridView().getItemCount() < 1){
      Message.warn(t('출력할 데이터가 없습니다.'))
      return
    }
    
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '고위험작업 점검 모니터링_개인별.xlsx',
      progressMessage: '엑셀 다운로드중입니다.',
      indicator: 'hidden',
      header: 'visible',
      footer: 'visible',
      allColumns: false,
      done: () => {
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    })
  }
}

const changeBsnsCd = async () => {
  await searchPartCd()
  await searchDamdCd()
  await searchDeptCd()
  await searchAsgnCd()
}

const changePartCd = async () => {
  await searchDamdCd()
  await searchDeptCd()
  await searchAsgnCd()
}

const changeDamdCd = async () => {
  await searchDeptCd()
  await searchAsgnCd()
}

const changeDeptCd = async () => {
  await searchAsgnCd()
}

const changeAsgnYN = () => {
  if(searchParams.ASGN_YN === 'Y') {
    readOnlyValue.ASGN_CD = false
  } else {
    readOnlyValue.ASGN_CD = true
  }
}

const closePage = pageName => {
  tagsStore.deleteVisitedView({ name: pageName })
  tagsStore.deleteCachedView({ name: pageName })
}

const onCellClicked = (grid, clickData) => {
  if(clickData.cellType !== 'data') {
    return
  }

  if(clickData.fieldName === 'TOTAL_CNT' || clickData.fieldName === 'OK_CNT' ||clickData.fieldName === 'BAD_CNT' ||
     clickData.fieldName === 'TYP_A_CNT' || clickData.fieldName === 'TYP_B_CNT' || clickData.fieldName === 'TYP_C_CNT' ||
     clickData.fieldName === 'TYP_D_CNT' || clickData.fieldName === 'TYP_E_CNT') {
    const data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

    closePage('30_safety-SAF_C-SAFCD0010')

    const routerParams = {
      FROM_DT: searchParams.FROM_DT,
      TO_DT: searchParams.TO_DT,
      BSNS_CD: data.BSNS_CD,
      DEPT_CD: data.DEPT_CD,
      ASGN_CD: data.USER_DIV_NM === '협력사' ? data.ASGN_CD : '',
      ASGN_YN: searchParams.ASGN_YN,
      SHIP_NO: searchParams.SHIP_NO,
      DN_DIV: searchParams.DN_DIV,
      THR_YN: searchParams.THR_YN,
      EMP_NO: data.EMP_NO,
      EMP_NM: data.EMP_NM,
    }

    router.push({ path: '/30_safety/SAF_C/SAFCD0010', state: { sliSAFCD0010: { tab: 'PTW' }, routerSAFCD0010Tab03: routerParams }})
  }
}

onMounted(() => {
  searchCodeList()
  searchBsnsCd()
  searchPartCd(false)
  searchDamdCd(false)
  searchDeptCd(false)
  searchAsgnCd(false)
  onButtonsClick({ id: 'btnSearch' })

  nextTick(() => {
    grdMain.value.getGridView().header.heights = [25, 50]
  })
})
</script>

<template>
  <div class="h-grow px-2 pt-1 pb-2">
    <v-sheet class="h-auto">
      <IGridTitle
        :button-list="['btnSearch', 'btnPrint']"
        @click-button="onButtonsClick"
      />
      <v-sheet class="searchArea">
        <div class="d-flex">
          <i-input
            v-model="searchParams.FROM_DT"
            label-width="60px"
            :label="$t('조회기간')"
            type="date"
            width="210px"
            class="mr-0"
          />
          <span class="mx-2 mt-1">~</span>
          <i-input
            v-model="searchParams.TO_DT"
            type="date"
            width="155px"
            class="ml-0"
            margin="10px"
          />
          <v-checkbox
            v-model="searchParams.HOLI_YN"
            label="주말, 공휴일 포함"
            true-value="Y"
            false-value="N"
            class="mT-2 mR-25"
          />
          <i-select
            v-model="searchParams.DN_DIV"
            label-width="60px"
            :label="$t('주/야구분')"
            :items="codeList.DN_DIV"
            item-title="TXT"
            item-value="COD"
            width="225px"
          />
          <i-select
            v-model="searchParams.SHIP_NO"
            label-width="80px"
            :label="$t('호선/프로젝트')"
            :items="codeList.SHIP_NO"
            item-title="TXT"
            item-value="COD"
            width="250px"
          />
          <v-checkbox
            v-model="searchParams.THR_YN"
            label="3중점검 대상"
            true-value="Y"
            false-value="N"
            class="mr-2"
            style="margin-top: 2px;"
          />
          <span class="mt-2" style="font-size: 15px; font-weight: bold; color: red">
            ※ 단기공사 PTW의 경우 3중점검 대상에서 제외
          </span>
        </div>
        <div class="d-flex mt-2">
          <i-select
            v-model="searchParams.BSNS_CD"
            label-width="60px"
            :label="$t('사업부')"
            width="230px"
            :items="codeList.BSNS_CD"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            @update:model-value="changeBsnsCd"
          />
          <i-select
            v-model="searchParams.PART_CD"
            label-width="30px"
            :label="$t('부문')"
            width="250px"
            :items="codeList.PART_CD"
            item-title="PART_NM"
            item-value="PART_CD"
            @update:model-value="changePartCd"
          />
          <i-select
            v-model="searchParams.DAMD_CD"
            label-width="30px"
            :label="$t('담당')"
            width="250px"
            :items="codeList.DAMD_CD"
            item-title="DAMD_NM"
            item-value="DAMD_CD"
            @update:model-value="changeDamdCd"
          />
          <i-select
            v-model="searchParams.DEPT_CD"
            label-width="40px"
            :label="$t('부서')"
            width="250px"
            :items="codeList.DEPT_CD"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            @update:model-value="changeDeptCd"
          />
          <i-select
            v-model="searchParams.ASGN_CD"
            label-width="50px"
            :label="$t('협력사')"
            width="250px"
            :items="codeList.ASGN_CD"
            item-title="ASGN_NM"
            item-value="ASGN_CD"
            margin="10px"
            :disabled="readOnlyValue.ASGN_CD"
          />
          <v-checkbox
            v-model="searchParams.ASGN_YN"
            label="협력사 포함"
            true-value="Y"
            false-value="N"
            class="mr-2"
            style="margin-top: 2px;"
            @update:model-value="changeAsgnYN"
          />
        </div>
      </v-sheet>
      <div class="h-grow">
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-sheet>
  </div>
</template>

<style scoped lang="scss">
</style>