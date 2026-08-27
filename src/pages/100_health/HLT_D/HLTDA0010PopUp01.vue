<!--     일주지앤에스 SI2팀 장필구    -->
<!--  프로그램명 : 제품 상세 이력   -->

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import IMenuTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import dayjs from "dayjs";
// import { useRoute, useRouter } from 'vue-router'
import HLTDA0010PopUp01_Sub01 from "@/pages/100_health/HLT_D/HLTDA0010PopUp01_Sub01.vue"
import HLTDA0050Popup01 from '@/pages/100_health/HLT_D/HLTDA0050Popup01.vue'

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const isAdmin = ref(false);
const emit = defineEmits(['selected', 'upDataRow'])
const menuTitle = ref(null);
const dialog = ref(false);
const grdMain = ref(null);
const grdSub = ref(null);
const hltda0010PopUp01_Sub01 = ref(null);
const hltda0050Popup01 = ref(null)

const popupParam = reactive({
  SaveData: {},
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  VNDCOD: '',
  SAUPBU: '',
  MATNO: '',
  TYPE_ID: '',
  REVNO : '',
  MATDSC : ''
})

const openPopup = (param) => {
  popupParam.SaveData = param
  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  searchParams.VNDCOD = param.VNDCOD
  searchParams.SAUPBU = param.SAUPBU
  searchParams.MATNO = param.MATNO
  searchParams.TYPE_ID = param.TYPE_ID
  searchParams.REVNO = param.REVNO
  searchParams.MATDSC = param.MATDSC
  dialog.value = true
  searchData()
}

const searchData = () => {
  // console.log(searchParams)
  Promise.all([
      commonSearchApi({
        queryId : "HLTDA0010_SEARCH_02",
        param : searchParams
      }),
      commonSearchApi({
        queryId : "HLTDA0010_SEARCH_03",
        param : searchParams
      })
  ]).then(async (res) => {
    console.log(res[0].ORESULT_CUR)
    console.log(res[1].ORESULT_CUR)
    const list = res[1].ORESULT_CUR
    list.forEach(item => {
      const formattedDate = dayjs(item.RECDATE, 'YYYYMMDD').format('YYYY-MM-DD')
      item.RECDATE = formattedDate
    })
    grdMain.value.getDataProvider().setRows(res[0].ORESULT_CUR);
    grdSub.value.getDataProvider().setRows(res[1].ORESULT_CUR);
  })
};

const grd1Props = reactive({
  gridViewOption: { edit: { editable: true } },
  keys: [],
  fields: [
    {
      fieldName: "KOR_NME",
      header: { text: t("국문명") },
      width: "150",
      styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "ENG_NME",
      header: { text: t("영문명") },
      width: "150",
      styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "CASNO",
      header: { text: t("CAS No.") },
      width: "150",
      styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "FT_IGDTRATE",
      header: { text: t("성분비") },
      width: "150",
      // styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      header: { text: t("규제 정보") },
      name: "EXTINFO",
      fieldName: "EXTINFO",
      width: 150,
      renderer: {
        type: "html",
        callback: function (grid, cell) {
          const value = cell.value || "";
          const colorMap = {
            금지: "#FF0000",
            사고: "#800080",
            제한: "#800080",
            유독: "#800080",
            특별: "#800080",
            허용: "#DAA520",
            관리: "#DAA520",
          };
          const htmlParts = value.split(",").map(item => {
            const char = item.trim();
            const color = colorMap[char] || "black";
            return `<span style="color:${color}; font-weight:bold;">${char}</span>`;
          });
          return htmlParts.join(" ");
        }
      }
    },
  ],
  columns: [],
})
grd1Props.columns = grd1Props.fields

const grd2Props = reactive({
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
grd2Props.columns = grd2Props.fields

const onButtonsClick = (btn) => {
  if (btn.id === 'btnReceivingHistory') {
    hltda0010PopUp01_Sub01.value.openPopup(searchParams)
  } else if (btn.id === 'btnHazardAssessment') {
    hltda0050Popup01.value.openPopup(searchParams)
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const closePopup = () => {
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
    width="1450"
    class="draggable-dialog"
  >
    <div class="title-bar">
      <span> 제품 상세 정보 </span>
    </div>
    <v-card>
      <v-card-title>
        <!-- :button-list="['btnReceivingHistory', 'btnHazardAssessment', 'btnClose']" -->
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnHazardAssessment', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <!-- 인적사항 -->
      <v-card-text class="pa-2 pt-0">
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
        <v-sheet class="my-2 mb-12" height="200px">
          <!-- :button-list="isAdmin === true ? ['btnReceivingHistory', 'btnHazardAssessment', 'btnClose'] : []" -->
          <IMenuTitle
            ref="menuTitle"
            :title="$t('성분')"
            :button-list="isAdmin === true ? ['btnHazardAssessment', 'btnClose'] : []"
          />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys"
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
          />
        </v-sheet>
        <v-sheet class="my-2 mb-12" height="200px">
          <IMenuTitle
            ref="menuTitle"
            :title="$t('입고이력')"
          />
          <RealGrid
            ref="grdSub"
            :grid-view-option="grd2Props.gridViewOption"
            :keys="grd2Props.keys"
            :fields="grd2Props.fields"
            :columns="grd2Props.columns"
            :column-layout="grd2Props.columnLayout"
          />
        </v-sheet>
        <!-- 팝업 -->
        <HLTDA0010PopUp01_Sub01 ref="hltda0010PopUp01_Sub01"/>
        <HLTDA0050Popup01 ref="hltda0050Popup01" />
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
