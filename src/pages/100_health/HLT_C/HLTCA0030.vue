<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import EmpPopup from '@/components/popup/EmpPopup.vue'

defineOptions({
  name: '100_health-HLT_A-HLTCA0030',
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  EMP_NO: '',
  STANDARD_YEAR: 'Y',
  YEAR_FROM: dayjs().subtract(4, 'year').format('YYYY'),
  YEAR_TO: dayjs().format('YYYY') - 1,
})

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'YEAR',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('기준연도') },
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('부서명') },
    },
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'JOB_TIT_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직위') },
    },
    {
      fieldName: 'AGE',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('나이') },
    },
    {
      fieldName: 'GENDER',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('성별') },
    },

    {
      fieldName: 'UNT_DUTY_CD',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직무') },
    },
    {
      fieldName: 'CUR_DUTY_DATE',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직무배치일') },
    },
    {
      fieldName: 'HLD_OFFI_GBN',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('재직구분') },
    },

    {
      fieldName: 'HEIGHT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('신장') },
    },
    {
      fieldName: 'WEIGHT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('체중') },
    },
    {
      fieldName: 'BMI',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('BMI') },
    },
    {
      fieldName: 'HTN',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('혈압(고)') },
    },
    {
      fieldName: 'LTN',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('혈압(저)') },
    },
    {
      fieldName: 'SUGAR',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('혈당') },
    },
    {
      fieldName: 'CHOL_TOT',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('총콜레스테롤') },
    },
    {
      fieldName: 'TG',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('중성지방') },
    },
    {
      fieldName: 'HDL',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('HDL') },
    },
    {
      fieldName: 'LDL',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('LDL') },
    },
    {
      fieldName: 'EXER_YN',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('운동여부') },
    },

    {
      fieldName: 'SMOKE_YN',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('흡연여부') },
    },
    {
      fieldName: 'DRINK_YN',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('음주여부') },
    },
    {
      fieldName: 'KOSHA_RISK',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('KOSHA 발병위험도') },
    },
    {
      fieldName: 'HYPERTENSION',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('고혈압') },
    },
    {
      fieldName: 'DIABETES',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('당뇨') },
    },
    {
      fieldName: 'OBESITY',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('비만단계') },
    },
    {
      fieldName: 'OCC_DISEASE_OBS',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직업병요관찰'), showTooltip: true, tooltip: '이름' },
      renderer: {
        showTooltip: true,
      },
    },
    {
      fieldName: 'OCC_DISEASE_OPN',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('직업병유소견') },
      renderer: {
        showTooltip: true,
      },
    },
    {
      fieldName: 'GEN_DISEASE_OBS',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('일반질병요관찰') },
      renderer: {
        showTooltip: true,
      },
    },

    {
      fieldName: 'GEN_DISEASE_OPN',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('일반질병유소견') },
      renderer: {
        showTooltip: true,
      },
    },
    {
      fieldName: 'NIGHT_DISEASE_OBS',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('야간작업질병요관찰') },
      renderer: {
        showTooltip: true,
      },
    },
    {
      fieldName: 'NIGHT_DISEASE_OPN',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('야간작업질병유소견') },
      renderer: {
        showTooltip: true,
      },
    },
  ],
  columns: [],
  columnLayout: [
    'YEAR',
    {
      name: '인적사항',
      direction: 'horizontal',
      items: ['EMP_NO', 'DEPT_NM', 'KOR_NM', 'JOB_TIT_NM', 'AGE', 'GENDER', 'UNT_DUTY_CD', 'CUR_DUTY_DATE'],
    },
    {
      name: '신체계측',
      direction: 'horizontal',
      items: ['HEIGHT', 'WEIGHT', 'BMI', 'HTN', 'LTN', 'SUGAR', 'CHOL_TOT', 'TG', 'HDL', 'LDL'],
    },
    {
      name: '건강행태',
      direction: 'horizontal',
      items: ['EXER_YN', 'SMOKE_YN', 'DRINK_YN'],
    },
    {
      name: '건강상태',
      direction: 'horizontal',
      items: [
        'HYPERTENSION',
        'DIABETES',
        'OBESITY',
        'OCC_DISEASE_OBS',
        'OCC_DISEASE_OPN',
        'GEN_DISEASE_OBS',
        'GEN_DISEASE_OPN',
        'NIGHT_DISEASE_OBS',
        'NIGHT_DISEASE_OPN',
      ],
    },
  ],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  grdMain.value.getGridView().onShowTooltip = function (grid, index, value) {
    var tooltip = value
    return tooltip
  }

  // vm.$nextTick(() => {
  //   grdMain.value.getGridView().setFixedOptions({
  //     colCount: 4,
  //   })
  // })
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTCA0030_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const empPopup = ref(null)
const openEmpPopup = () => {
  empPopup.value.openPopup({
    EMP_NM: searchParam.MANAGER,
  })
}

// 사번 이벤트
const selectedEmp = (val) => {
  searchParam.EMP_NO = val.EMP_NO
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('사번')"
              width="200px"
              v-model="searchParam.EMP_NO"
              :append-inner-icon="'mdi-magnify'"
              clearable
              @click:appendInner="openEmpPopup"
              @click:clearable="() => (searchParam.EMP_NO = '')"
              @keydown.enter="openEmpPopup"
            >
            </i-input>
            <v-checkbox
              class="mt-1 mr-2"
              true-value="Y"
              false-value="N"
              label="기준 연도"
              v-model="searchParam.STANDARD_YEAR"
            >
            </v-checkbox>
            <i-select width="150px" type="YEAR" v-model="searchParam.YEAR_FROM"> </i-select>
            <span class="mt-2 mr-1">~</span>
            <i-select width="150px" type="YEAR" v-model="searchParam.YEAR_TO"> </i-select>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <EmpPopup ref="empPopup" @selected="selectedEmp"></EmpPopup>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
