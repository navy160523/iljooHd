<!--
  화면명 : 사용팀 관리
  화면개요 : 어떤 팀에 배정할 지 결정하는 팝업
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'

const emit = defineEmits(['after-search'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)

/* 복사 조건 */
const searchParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible: false } },
  keys: [],
  fields: [
  { fieldName: 'TEAM_CD', width: '30', dataType: 'text', header: { text: t('팀코드') }, },
    { fieldName: 'ASGN_SHRT_NM', width: '60', dataType: 'text', editable: false, header: { text: t('팀') }, },

    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부') }, visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', header: { text: t('부서코드') }, visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

// 팝업 오픈 시 실행
const openPopup = (param, checkData, data) => {
  searchParams.CMPNY_DIV = param.CMPNY_DIV
  searchParams.DEPT_CD = param.DEPT_CD
  grdMain.value.getDataProvider().setRows([])

  const seen = new Set()
  const keysToExtract = ['CMPNY_DIV', 'SAUPBU', 'MATNO', 'VNDCOD', 'TEAM_CD']
  data = data.map(obj =>
    Object.fromEntries(
      Object.entries(obj).filter(([key]) => keysToExtract.includes(key))
    )
  ).filter(obj => {
    const key = JSON.stringify(obj)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  Promise.all([
    commonSearchApi({ queryId: 'HLTDA0020_SEARCH_TEAM', param: searchParams }),
  ]).then((res) => {
    let tempList = []
    let removeList = []

    // check된 msds중 이미화학물질에 저장된 목록 가져온다.
    for(let chk of checkData) {
      let filterList = data.filter(item => item.CMPNY_DIV == chk.CMPNY_DIV &&
        item.SAUPBU == chk.SAUPBU && item.MATNO == chk.MATNO && item.VNDCOD == chk.VNDCOD)
      tempList.push(...filterList)
    } 

    // 각각의 사용팀 갯수를 가져온다.
    const cnt = tempList.reduce((acc, curr) => {
      const key = curr.TEAM_CD
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}) 

    // 이미 msds저장이 다 된 사용팀의 경우에는 저장 사용팀 목록에서 빠진다.
    for(let c in cnt) {
      if(cnt[c] == checkData.length) {
        removeList.push(c)
      }
    }

    grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR.filter(item => !removeList.includes(item.TEAM_CD)))
  })
  dialog.value = true
}


// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    vm.$swal({
      title: t('저장하시겠습니까?'),
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed === true) {
        let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
        let tossData = []
        if(isEmpty(checkedRows)) {
          return Message.warn(t('사용팀을 선택하여 주십시오.'))
        }
        
        for (let rowIdx of checkedRows) {
          tossData.push(grdMain.value.getDataProvider().getJsonRow(rowIdx))
        }
        emit('select-team',tossData)
        closePopup()
      } 
    })
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}

/* ********** 닫기 ********** */
const closePopup = () => {
  emit('after-search')
  dialog.value = false 
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="500"
    height="600"
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
      <span>MSDS 추가</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4">
        <IGridTitle
          ref="menuTitle"
          :title="$t('팀 목록')"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 350px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
