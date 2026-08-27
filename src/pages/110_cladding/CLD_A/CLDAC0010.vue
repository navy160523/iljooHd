<script setup>
import { reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import CLDAC0010Popup01 from './CLDAC0010Popup01.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'

defineOptions({
  name: '110_cladding-CLD_A-CLDAC0010',
})

const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const menuTitle = ref(null)
const userStore = useUserStore()
const userLogStore = useLogsStore()
const grdMain = ref(null)
const cLDAC0010Popup01 = ref(null)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  USER_DIV: '', //소속구분
  CLOTHE_GUBUN: '', //피복구분
})

const codeList = reactive({
  USER_DIV: [], //소속구분
  CLOTHE_COUNT: [], //지급수량
  CLOTHE_GUBUN: [], //피복구분
})

const initCodeList = () => {
  Promise.all([
    //소속구분
    getCodeList('HHIZ020'),
    //피복구분
    getCodeList('HHIT060'),
    //지급수량
    getCodeList('HHIT080'),
  ]).then((res) => {
    console.log('res', res)
    //단기공사,기타 제외
    codeList.USER_DIV = res[0].ORESULT_CUR.filter((x) => !['Z', 'D'].includes(x.COD))
    codeList.CLOTHE_GUBUN = res[1].ORESULT_CUR.filter((x) => x.COD != '1') //SAFE클로버 피복은 제외
    codeList.CLOTHE_COUNT = res[2].ORESULT_CUR
    codeList.USER_DIV.unshift({ TXT: '전체', COD: '' })
    codeList.CLOTHE_GUBUN.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('USER_DIV', codeList.USER_DIV, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CLOTHE_GUBUN', codeList.CLOTHE_GUBUN, 'COD', 'TXT')
    grdMain.value.setBindingColumn('CLOTHE_COUNT', codeList.CLOTHE_COUNT, 'COD', 'TXT')
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'USER_DIV',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('구분') },
      mergeRule: { criteria: 'value' },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'CLOTHE_GUBUN',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('피복구분') },
      mergeRule: "values['USER_DIV'] + value",
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'OFFI_RES_NM',
      dataType: 'text',
      width: '15',
      editable: false,
      header: { text: t('직책') },
    },
    {
      fieldName: 'CLOTHE_COUNT',
      dataType: 'text',
      styleName: 'editable_column',
      width: '15',
      header: { text: t('지급수량') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'REMARKS',
      width: '100',
      styleName: 'editable_column-left',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('비고') },
    },

    //안보이는컬럼
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'OFFI_RES_CD',
      visible: false,
      header: { text: t('직책,직무,직위코드') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  initCodeList()
  //onButtonsClick({ id: 'btnSearch' })
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t).setBefore(beforeSave).setQuery(saveData).setAfter(afterSave).run()
  }
  //2025.06.27김현재 작성 지급기준관리에 추가기능은 주석처리 해서 DB단에서 추가하는걸로 DT팀,유지보수팀과 협의해서 주석처리함. 필요시 주석해제
  //else if (btn.id == 'btnCreate') {
  //   cLDAC0010Popup01.value.openPopup()
  //}
  else {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  }
}

//저장관련 로직 시작
const beforeSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('저장할 데이터를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    if (!data.CLOTHE_COUNT) {
      Message.warn(t('지급수량을 입력해주세요.'))
      return false
    }
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let saveData = {
      CMPNY_DIV: data.CMPNY_DIV, //회사구분
      OFFI_RES_NM: data.OFFI_RES_NM, //직책명
      CLOTHE_GUBUN: data.CLOTHE_GUBUN, //피복구분
      USER_DIV: data.USER_DIV, //조직구분
      OFFI_RES_CD: data.OFFI_RES_CD, //직책,직위,직무코드
      CLOTHE_COUNT: data.CLOTHE_COUNT, //지급수량
      REMARKS: data.REMARKS, //비고
      USER_ID: userStore.userId, //로그인유저 아이디
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'CLDAC0010_SAVE_01',
    list: saveParam,
  })
}

const afterSave = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//저장관련 로직 끝

//조회관련 로직 시작

const searchData = () => {
  return commonSearchApi({
    queryId: 'CLDAC0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//조회관련 로직 끝

//삭제관련 로직 시작
const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV,
      OFFI_RES_NM: data.OFFI_RES_NM,
      CLOTHE_GUBUN: data.CLOTHE_GUBUN,
      USER_DIV: data.USER_DIV,
    }
    deleteParam.push(deleteData)
  }

  return commonExecuteApi({
    queryId: 'CLDAC0010_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              v-model="searchParam.USER_DIV"
              :label="$t('소속구분')"
              width="200px"
              labelWidth="50px"
              :items="codeList.USER_DIV"
              item-title="TXT"
              item-value="COD"
            >
            </i-select>
            <i-select
              v-model="searchParam.CLOTHE_GUBUN"
              :label="$t('피복구분')"
              width="200px"
              labelWidth="50px"
              :items="codeList.CLOTHE_GUBUN"
              item-title="TXT"
              item-value="COD"
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
  <CLDAC0010Popup01 ref="cLDAC0010Popup01" @Saved="() => onButtonsClick({ id: 'btnSearch' })"></CLDAC0010Popup01>
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
