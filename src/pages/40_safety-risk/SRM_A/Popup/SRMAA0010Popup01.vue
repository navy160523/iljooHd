<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

const emit = defineEmits(['close'])
const vm = getCurrentInstance().proxy
const t = useI18n().t
const dialog = ref(false)
const slideData = ref([])
const currData = ref({})
const slide = ref(null)
const grdMain = ref(null)
const isSaved = ref(false)
const searchParams = reactive({
  FROM_DT: '',
  TO_DT: '',
})

const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: false },
  }, 
  fields: [
    { fieldName: 'TASK_SEQ', dataType: 'text',  header: { text: t('통합관리번호') }, width: '100', },
    { fieldName: 'REG_DT', dataType: 'text',  header: { text: t('등록일자') }, width: '100', },
    { fieldName: 'RISK_NM', dataType: 'text',  header: { text: t('제목') }, styleName: 'left-column', width: '250', },
    { fieldName: 'DEPT_NM', dataType: 'text',  header: { text: t('부서') }, width: '150', },
    { fieldName: 'RESULT_NM', dataType: 'text',  header: { text: t('진행상태') }, width: '150', },
    {
      fieldName: 'IMP_FI_DT', dataType: 'text',  header: { text: t('개선기간') }, styleName: 'multiline-editor', width: '125',
      renderer: {
        type: 'html',
        callback: function (grid, model, width, height) {
          let daysDifference = ''

          if (dayjs(model.value).format('YYYY-MM-DD') < dayjs().format('YYYY-MM-DD')) {
            daysDifference = '(+' + dayjs().diff(dayjs(model.value), 'day') + ' Days)'
          } else if (dayjs(model.value).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) {
            daysDifference = '(D-Day)'
          } else {
            daysDifference = ''
          }

          return '<span>~ '+ dayjs(model.value).format('YYYY-MM-DD') + '</span><br/>' + '<span style=\'color: red;\'>' + daysDifference + '</span>'
        }
      }
    },
    {
      fieldName: 'SELECT_ROW',
      dataType: 'text',
      header: { text: t(' ') },
      renderer: {
        type: 'button'
      },
      width: '75',
    },
    { fieldName: 'BSNS_NM', dataType: 'text',  header: { text: t('사업부') }, visible: false, },
    { fieldName: 'EMP_NM', dataType: 'text',  header: { text: t('제보자') }, visible: false, },
    { fieldName: 'TASK_NO_1', dataType: 'text',  header: { text: t('Hi-SAFE 관리번호') }, visible: false, },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const openPopup = () => {
  dialog.value = true

  searchParams.FROM_DT = dayjs().format('YYYY-01-01')
  searchParams.TO_DT = dayjs().format('YYYY-MM-DD')

  searchSlide()
}

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    searchSlide()
  } else if(btn.id === 'btnUpdate') {
    saveSlide()
  } else if(btn.id === 'btnClose') {
    dialog.value = false
    emit('close', isSaved.value)
  }
}

const onButtonsClick2 = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
        .setQuery(searchData)
        .setAfter(afterSearch)
        .run()
  }
}

const searchSlide = () => {
  commonSearchApi({ queryId: 'SRMAA0010_SEARCH_07', param: {} }).then(res => {
    const data = res.ORESULT_CUR

    if(data.length < 1) {
      data.push({
        SLIDE_SEQ: 1,
        RISK_NM: '',
        BSNS_NM: '',
        DEPT_NM: '',
        EMP_NM: '',
        REG_DT: '',
        TASK_SEQ: '',
        TASK_NO_1: '',
      })
    }

    slideData.value = data
    slide.value = 0
    setCurrData()
  })
}

const setCurrData = () => {
  if(slide.value == null) {
    currData.value = {}
  } else {
    currData.value = slideData.value[slide.value]
  }
}

const addSeq = () => {
  // 순서 삽입
  slideData.value.push({ SLIDE_SEQ: slideData.value.length + 1 })

  // 삽입 된 순서가 선택되도록
  slide.value = slideData.value.length - 1

  // 현재 선택 데이터 업데이트
  setCurrData()
}

const delSeq = () => {
  // 순서 삭제
  slideData.value.splice(slide.value, 1)

   // 순서 삭제 후 번호 다시 매김
  for(let i = 0; i < slideData.value.length; i++) {
    slideData.value[i].SLIDE_SEQ = i + 1
  }

  // 삭제한 순번 이전의 순번 선택되도록, 모두 삭제된 상태면 값 비움
  if(slideData.value.length > 0) {
    if(slide.value > 0) {
      slide.value = slide.value - 1
    }
  } else {
    slide.value = null
  }
  
  // 현재 선택 데이터 업데이트
  setCurrData()
}

const searchData = () => {
  return commonSearchApi({ queryId: 'SRMAA0010_SEARCH_08', param: searchParams }) 
}

const afterSearch = res => {
  const data = res.ORESULT_CUR

  data.forEach(row => {
    row.SELECT_ROW = '선택'
  })

  grdMain.value.getDataProvider().setRows(data)
}

const onCellItemClicked = async (grid, index, clickData) => {
  if(clickData.cellType === 'data') {
    if(clickData.fieldName === 'SELECT_ROW') {
      if(slideData.value.length < 1 || slide.value == null) {
        Message.warn('순서를 선택해 주세요.')
        return
      }

      const currRow = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
      slideData.value[slide.value].RISK_NM = currRow.RISK_NM
      slideData.value[slide.value].BSNS_NM = currRow.BSNS_NM
      slideData.value[slide.value].DEPT_NM = currRow.DEPT_NM
      slideData.value[slide.value].EMP_NM = currRow.EMP_NM
      slideData.value[slide.value].REG_DT = currRow.REG_DT
      slideData.value[slide.value].TASK_SEQ = currRow.TASK_SEQ
      slideData.value[slide.value].TASK_NO_1 = currRow.TASK_NO_1
      setCurrData()
    }
  }
}

const saveSlide = async () => {
  const result = await vm.$swal({
    title: t('저장 하시겠습니까?'),
    showCancelButton: true,
  })

  if(result.isConfirmed) {
    const saveParams = []

    let seq = 1
    for(let i = 0; i < slideData.value.length; i++) {
      const temp = slideData.value[i]

      if(temp.TASK_SEQ != null
         && temp.TASK_SEQ != undefined
         && temp.TASK_SEQ !== '') {
        temp.SLIDE_SEQ = seq
        saveParams.push(temp)
        seq++
      }
    }

    // console.log('saveParams', saveParams)

    commonExecuteApi({ queryId: 'SRMAA0010_DELETE_01', list: [{ TEMP: '' }] }).then(res0 => {
      commonExecuteApi({ queryId: 'SRMAA0010_SAVE_01', list: saveParams }).then(res1 => {
        searchSlide()
        isSaved.value = true
        Message.success('저장 되었습니다.')
      })
    })
  }
}

onMounted(() => {
  
})

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1200px"
  >
    <div class="title-bar">
      {{ $t('전사 개선완료 사례 관리') }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-2 py-0">
        <IGridTitle :button-list="['btnSearch', 'btnUpdate', 'btnClose']" @click-button="onButtonsClick" />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <v-sheet class="pa-0 mt-1">
            <div class="d-flex d-flex align-center">
              <div class="d-flex align-center">
                <div class="slide-title d-flex justify-center align-center">
                  순서
                </div>
                <v-slide-group
                  v-model="slide"
                  selected-class="selected-slide"
                  mandatory
                  show-arrows
                  center-active
                  @update:model-value="setCurrData"
                  class="slide-grp"
                >
                  <v-slide-group-item
                    v-for="item in slideData"
                    :key="item.SLIDE_SEQ"
                    v-slot="{ toggle, selectedClass }"
                  >
                    <v-card
                      :class="['ma-1', selectedClass]"
                      color="#ccddee"
                      height="40"
                      width="40"
                      @click="toggle"
                    >
                      <div class="d-flex fill-height align-center justify-center slide-seq">
                        {{ item.SLIDE_SEQ }}
                      </div>
                    </v-card>
                  </v-slide-group-item>
                </v-slide-group>
              </div>
              <div>
                <v-btn icon="mdi-plus" @click="addSeq" />
                <v-btn icon="mdi-minus" @click="delSeq" />
              </div>
            </div>
          </v-sheet>
          <v-sheet class="pa-0 mt-2">
            <div class="d-flex">
              <i-input
                v-model="currData.RISK_NM"
                margin="0"
                :label="$t('제목')"
                label-width="60px"
                width="880px"
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="currData.BSNS_NM"
                :label="$t('사업부')"
                label-width="60px"
                width="250px"
                readonly
              />
              <i-input
                v-model="currData.DEPT_NM"
                :label="$t('부서')"
                label-width="80px"
                width="280px"
                readonly
              />
              <i-input
                v-model="currData.EMP_NM"
                margin="0"
                :label="$t('제보자')"
                label-width="110px"
                width="310px"
                readonly
              />
            </div>
            <div class="d-flex mt-2">
              <i-input
                v-model="currData.REG_DT"
                :label="$t('등록일자')"
                label-width="60px"
                width="250px"
                readonly
              />
              <i-input
                v-model="currData.TASK_SEQ"
                :label="$t('통합관리번호')"
                label-width="80px"
                width="280px"
                readonly
              />
              <i-input
                v-model="currData.TASK_NO_1"
                margin="0"
                :label="$t('Hi-SAFE 관리번호')"
                label-width="110px"
                width="310px"
                readonly
              />
            </div>
          </v-sheet>
          <v-sheet class="mt-2 mb-0">
            <IGridTitle :button-list="['btnSearch']" @click-button="onButtonsClick2" />
          </v-sheet>
          <v-sheet class="searchArea mb-0">
            <div class="d-flex">
              <i-input
                v-model="searchParams.FROM_DT"
                :label="$t('등록기간')" 
                width="200px"
                type="date" 
                margin="10px"
              /> 
              <i-input 
                v-model="searchParams.TO_DT"
                :label="$t('~')" 
                label-width="10px"
                width="165px"
                type="date"
              />
            </div>
          </v-sheet>
          <v-sheet height="375px" class="mt-2">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellItemClicked="onCellItemClicked"
            />
          </v-sheet>
        </v-sheet>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style lang="scss" scoped>
.slide-grp {
  width: 730px;
  background-color: #eeeeee;
  border: 1px solid #dddddd;
  border-radius: 4px;
}

.slide-seq {
  color: #ffffff;
}

.selected-slide {
  background-color: rgb(96, 140, 255) !important;
}

.slide-title {
  width: 60px;
  height: 40px;
  background-color: #8877ff;
  margin-right: 4px;
  border-radius: 4px;
  color: #ffffff;
}
</style>