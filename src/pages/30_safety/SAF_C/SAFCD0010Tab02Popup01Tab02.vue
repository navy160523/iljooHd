<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const emit = defineEmits(['mounted2'])
const grdMain = ref(null)
const searchParam = reactive({
  CHECK_TARGET: '', //점검대상
  FROM_DATE: '', //점검기간 FROM
  TO_DATE: '', //점검기간 TO
})

const totalData = reactive({
  CHECK_PLAN_SEQ: '',
})

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'CHECK_TARGET_DESC',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      mergeRule: { criteria: 'value' },
      header: { text: t('점검항목') },
    },
    {
      fieldName: 'CHECK_LIST_DESC',
      dataType: 'text',
      editable: false,
      styleName: 'left-column',
      header: { text: t('점검 세부항목') },
    },
    {
      fieldName: 'CHECK_CNT_SUM',
      dataType: 'number',
      editable: false,
      numberFormat: '#,##0',
      styleName: 'right-column',
      header: { text: t('점검(개소)') },
    },
    {
      fieldName: 'BET_CNT_SUM',
      dataType: 'number',
      editable: false,
      numberFormat: '#,##0',
      styleName: 'right-column',
      header: { text: t('불량(개소)') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const totalCollection = (data) => {
  console.log('전체취합 데이터', data)
  totalData.CHECK_PLAN_SEQ = data.CHECK_PLAN_SEQ
  searchParam.CHECK_TARGET = data.CHECK_TARGET
  searchParam.FROM_DATE = data.FROM_DATE
  searchParam.TO_DATE = data.TO_DATE
  let param = {
    CHECK_PLAN_SEQ: data.CHECK_PLAN_SEQ,
    FROM_DATE: data.FROM_DATE,
    TO_DATE: data.TO_DATE,
  }
  commonSearchApi({
    queryId: 'SAFCD0010_SEARCH06',
    param: param,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

onMounted(() => {
  emit('mounted2')
})

watch(
  () => searchParam.FROM_DATE,
  (newValue, oldValue) => {
    //점검기간 FROM 변경시 기간에 해당하는 점검대상 전체취합 조회
    let param = {
      CHECK_PLAN_SEQ: totalData.CHECK_PLAN_SEQ,
      FROM_DATE: newValue,
      TO_DATE: searchParam.TO_DATE,
    }
    commonSearchApi({
      queryId: 'SAFCD0010_SEARCH06',
      param: param,
    }).then((res) => {
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }
)

watch(
  () => searchParam.TO_DATE,
  (newValue, oldValue) => {
    //점검기간 TO 변경시 기간에 해당하는 점검대상 전체취합 조회
    let param = {
      CHECK_PLAN_SEQ: totalData.CHECK_PLAN_SEQ,
      FROM_DATE: searchParam.FROM_DATE,
      TO_DATE: newValue,
    }
    commonSearchApi({
      queryId: 'SAFCD0010_SEARCH06',
      param: param,
    }).then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
      } else {
        Message.warn(t('데이터가 없습니다.'))
        grdMain.value.getDataProvider().setRows(null)
        return false
      }
    })
  }
)

defineExpose({
  totalCollection,
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IGridTitle ref="menuTitle" @click-button="onButtonsClick" />
    </v-card-title>
    <v-card-text class="pa-3 pb-0">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('점검대상')"
            width="200px"
            v-model="searchParam.CHECK_TARGET"
            readonly
          >
          </i-input>
          <i-input
            :label="$t('점검기간')"
            width="200px"
            type="date"
            v-model="searchParam.FROM_DATE"
            readonly
          >
          </i-input>
          <i-input
            width="150px"
            type="date"
            v-model="searchParam.TO_DATE"
            readonly
          >
          </i-input>
        </v-sheet>
        <v-sheet>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            style="height: 450px"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>
