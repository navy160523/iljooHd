<!--     일주지앤에스 SI2팀 장필구    -->
<!--  프로그램명 : 입고 상세 이력   -->

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import IMenuTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import dayjs from "dayjs";

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow'])
const menuTitle = ref(null);
const isAdmin = ref(false);
const dialog = ref(false);
const grdMain = ref(null);
const popupParam = reactive({
  SaveData: {},
})
// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  VNDCOD: '',
  SAUPBU: '',
  MATNO: ''
})

const openPopup = (param) => {
  popupParam.SaveData = param
  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  searchParams.VNDCOD = param.VNDCOD
  searchParams.SAUPBU = param.SAUPBU
  searchParams.MATNO = param.MATNO
  dialog.value = true
  searchData()
}

const searchData = () => {
  Promise.all([
      commonSearchApi({
        queryId : "HLTDA0010_SEARCH_03",
        param : searchParams
      })
  ]).then(async (res) => {
    // console.log('전' , res[0].ORESULT_CUR)
    const list = res[0].ORESULT_CUR
    list.forEach(item => {
      const formattedDate = dayjs(item.RECDATE, 'YYYYMMDD').format('YYYY-MM-DD')
      item.RECDATE = formattedDate
    })
    // console.log('후' , res[0].ORESULT_CUR)
    grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR);
  })
};

const grd1Props = reactive({
  gridViewOption: { edit: { editable: true } },
  keys: [],
  fields: [
    {
      fieldName: "MATNO",
      header: { text: t("자재번호") },
      width: "150",
      // styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "MATDSC",
      header: { text: t("자재명") },
      width: "150",
      styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "DWGDPTNM",
      header: { text: t("청구부서") },
      width: "150",
      styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "ACPTDPTNM",
      header: { text: t("입고부서") },
      width: "150",
      // styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "RECDATE",
      header: { text: t("입고일자") },
      width: "150",
      // styleName: "left-column",
      datetimeFormat: "yyyy-MM-dd",
      dataType: "datetime",
      editable: false,
    },
    {
      fieldName: "RECQTY",
      header: { text: t("입고량") },
      width: "150",
      styleName: "right-column",
      dataType: "number",
      numberFormat: "#,##0",
      editable: false,
    }
  ],
  columns: [],
})
grd1Props.columns = grd1Props.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  }
}

const closePopup = () => {
  //searchSubData.value()
  // emit('after-search')
  grdMain.value.getDataProvider().setRows([])
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1000"
    class="draggable-dialog"
  >
    <div class="title-bar" @mousedown="startDragging">
      <span> 상세 입고 이력 </span>
    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 인적사항 -->
      <v-card-text class="overflowY">
        <v-card class="mb-3 mr-1 popUp-input-Form">
          <v-card-text class="pa-0">
            <div>
              <div class="d-flex my-2">
                <i-input v-model="popupParam.SaveData.MATNO" width="200px" :label="$t('자재번호')" type="Text" margin="30px" readonly/>
                <i-input v-model="popupParam.SaveData.MATDSC" width="400px" :label="$t('제품명')" type="Text" margin="30px" readonly/>
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-sheet class="my-2" height="250px">
            <IMenuTitle
              ref="menuTitle"
              :title="$t('성분')"
              :button-list="isAdmin === true ? ['btnClose'] : []"
            />
            <RealGrid
              ref="grdMain"
              class="mt-0 mb-2"
              :grid-view-option="grd1Props.gridViewOption"
              :keys="grd1Props.keys"
              :fields="grd1Props.fields"
              :columns="grd1Props.columns"
              :column-layout="grd1Props.columnLayout"
            />
          </v-sheet>
        <!-- 팝업 -->
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
.fileDiv {
  width: 100%;
  padding: 12px;
  background: #fff;
}

.radio-box {
  background-color: #fff;
  padding: 3px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
  width: 250px;
}
.box {
  background: #fff;
  padding: 8px;
  border-radius: 12px;
}
</style>
