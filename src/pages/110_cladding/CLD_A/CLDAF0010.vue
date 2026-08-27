<script setup>
import { reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, getCodeList } from '@hiway/api/commonApi'
import dayjs from 'dayjs'
defineOptions({
  name: '110_cladding-CLD_A-CLDAF0010',
})

const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const menuTitle = ref(null)
const userStore = useUserStore()
const userLogStore = useLogsStore()
const grdMain = ref(null)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: new Date().getFullYear(), //년도
  REQ_CHA: '0', ///신청시기
  USER_DIV: '', //조직구분
})

const codeList = reactive({
  REQ_CHA: [], //신청시기
  USER_DIV: [], //소속구분 직영:A 협력사 :B
  CLOTHES_GUBUN: [], //피복종류
})

const initCodeList = () => {
  Promise.all([getCodeList('HHIT050'), getCodeList('HHIZ020'), getCodeList('HHIT060')]).then((res) => {
    codeList.REQ_CHA = res[0].ORESULT_CUR
    //단기공사,기타 제외
    codeList.USER_DIV = res[1].ORESULT_CUR.filter((x) => !['Z', 'D'].includes(x.COD))
    codeList.CLOTHES_GUBUN = res[2].ORESULT_CUR
    //codeList.REQ_CHA.unshift({ TXT: '전체', COD: '' })
    codeList.USER_DIV.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('REQ_CHA', codeList.REQ_CHA, 'COD', 'TXT')
    grdMain.value.setBindingColumn('USER_DIV', codeList.USER_DIV, 'COD', 'TXT')
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'USER_DIV',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('구분') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('사업부') },
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('부서코드') },
    },
    {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('소속') },
    },
    {
      fieldName: 'EMP_NO',
      width: '15',
      editable: false,
      header: { text: t('사번') },
    },

    {
      fieldName: 'EMP_NM',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'OFFI_RES_NM',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('직책') },
    },

    {
      fieldName: 'OFFI_RES_DATE',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('직책보임일자') },
    },
    {
      fieldName: 'HLD_OFFI_GBN',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('재직구분') },
    },
    {
      fieldName: 'INITIAL_YN',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('초도지급 여부') },
    },
    {
      fieldName: 'REMARKS',
      width: '80',
      styleName: 'left-column',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('비고') },
    },
    {
      fieldName: 'FLAG',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  initCodeList()
  let day = dayjs().format('MM-DD')
  if (day >= '07-01') {
    searchParam.REQ_CHA = '1'
  } else {
    searchParam.REQ_CHA = '0'
  }
  //onButtonsClick({ id: 'btnSearch' })
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  }
}

//조회관련 로직 시작
const searchData = () => {
  return commonSearchApi({
    queryId: 'CLDAF0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}
//조회관련 로직 끝
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
            <i-select :label="$t('년도')" width="150px" type="YEAR" v-model="searchParam.YEAR"> </i-select>
            <i-select
              :label="$t('신청시기')"
              width="200px"
              labelWidth="50px"
              :items="codeList.REQ_CHA"
              item-title="TXT"
              item-value="COD"
              v-model="searchParam.REQ_CHA"
            >
            </i-select>
            <i-select
              :label="$t('조직구분')"
              :items="codeList.USER_DIV"
              item-title="TXT"
              item-value="COD"
              width="200px"
              labelWidth="50px"
              v-model="searchParam.USER_DIV"
            >
            </i-select>
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
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
    min-height: 700px;
  }
}
</style>
