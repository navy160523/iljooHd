<!--
   SI2팀 김성근
 화면명 : 안전사고 사고/통계 Dashboard
 화면개요 : 사고/통계 Dashboard
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from "dayjs"
import TAB01 from "./SAFAA0010_TAB01.vue"
import TAB02 from "./SAFAA0010_TAB02.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import Message from "@hiway/utils/notify"
import SAFAD0010Popup2 from "./SAFAD0010Popup2.vue"
import { returnOrUpdate } from "ol/extent"

defineOptions({
  name: "30_safety-SAF_A-SAFAA0010",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)
const grdMain = ref(null)
const plzSagoSearch = ref(false)
const plzTongSearch = ref(false)
const SagoData = reactive({})
const TongData = reactive({})
const tab = ref("accident")
const sAFAD0010Popup2 = ref(null)
const onButtonsClick = (btn) => {
  if (btn.id === "btnWeeklyMonthlyStatus") {
    sAFAD0010Popup2.value.openPopup()
  }

  if (tab.value === "accident") {
    if (btn.id === "btnSearch") {
      plzSagoSearch.value = true
    }
  }
  if (tab.value === "Tong") {
    if (btn.id === "btnSearch") {
      plzTongSearch.value = true
    }
  }
}

onMounted(() => {
  plzSagoSearch.value = true
  // SearchParam({
  //   CMPNY_DIV: userStore.cmpnyDiv,
  //   FROM: dayjs().startOf("year").format("YYYY-MM-DD"),
  //   TO: dayjs().format("YYYY-MM-DD"),
  //   SAGO_GBN: "A",
  //   DEPT_CD: userStore.deptCd,
  //   BSNS_CD: userStore.bsnsCd,
  // })
})

watch(
  () => tab.value,
  (newValue) => {
    if (newValue !== "" || newValue !== undefined || newValue !== null) {
      if (newValue === "accident") {
        plzSagoSearch.value = true
        SearchParam({
          CMPNY_DIV: userStore.cmpnyDiv,
          FROM: dayjs().startOf("year").format("YYYY-MM-DD"),
          TO: dayjs().format("YYYY-MM-DD"),
          SAGO_GBN: "A",
          DEPT_CD: userStore.deptCd,
          BSNS_CD: userStore.bsnsCd,
        })
      } else {
        plzTongSearch.value = true
        TongParam({
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: "",
          DEPT_CD: "",
          YEAR: dayjs().format("YYYY"),
          WEEK_MONTH: dayjs().format("M"),
          GBN: "M",
        })
      
      }
    }
  }
)

const TongParam = async (e) => {
  if(e.YEAR*1<2024){
    Message.warn(t('2024년도부터 검색가능합니다.'))
    
    return plzTongSearch.value = false
  } 
  await commonSearchApi({ queryId: "SAFAA0010_search02", param: e })
    .then((res) => {
      console.log(res,'resS')
      for (let i in res) {
        // console.log(i.ORESULT_CUR4,'res')
        TongData[i] = res[i]
      }
      plzTongSearch.value = false
    })
    .catch((err) => {
      Message.warn(t("조회에 실패했습니다. 담당자에게 문의바랍니다."))
    })
    .finally(() => {
      Message.success(t("조회되었습니다."))
    })
}

const SearchParam = async (e) => {
  let searchData = {}
  console.log('ddd')
  if (!e.CMPNY_DIV || !e.FROM || !e.TO || !e.SAGO_GBN) {
    return (
      Message.warn(t("필수조건을 입력해주세요.")), (plzSagoSearch.value = false)
    )
  }

  for (let i in e) {
    searchData[i] = e[i]
  }
  searchData.FROM = dayjs(searchData.FROM).format("YYYYMMDD")
  searchData.TO = dayjs(searchData.TO).format("YYYYMMDD")
  await commonSearchApi({ queryId: "SAFAA0010_search01", param: searchData })
    .then((res) => {
      console.log(res, "resjfklasdlnsdafmnsdahj")
      for (let i in res) {
        SagoData[i] = res[i]
      }

      plzSagoSearch.value = false
      console.log(SagoData, "SagoData")
    })
    .catch((err) => {
      Message.warn(t("조회에 실패했습니다. 담당자에게 문의바랍니다."))
    })
    .finally(() => {
      Message.success(t("조회되었습니다."))
    })
}
</script>
<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnWeeklyMonthlyStatus']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <v-sheet class="d-flex flex-column fill-height">
        <v-sheet>
          <VTabs v-model="tab">
            <VTab value="accident">사고 Dashboard</VTab>
            <VTab value="Tong">통계 Dashboard</VTab>
          </VTabs>
        </v-sheet>
        <v-window v-model="tab"  style="overflow: auto;">
          <v-window-item value="accident">
            <TAB01
              :plzSagoSearch="plzSagoSearch"
              :SagoData="SagoData"
              @SearchParam="SearchParam"
            />
          </v-window-item>

          <v-window-item value="Tong">
            <TAB02
              :plzTongSearch="plzTongSearch"
              :TongData="TongData"
              @TongParam="TongParam"
            />
          </v-window-item>
        </v-window>
      </v-sheet>
      <!-- 조회조건 -->
      <SAFAD0010Popup2 ref="sAFAD0010Popup2"></SAFAD0010Popup2>
      <!-- 메인그리드 -->
    </v-card-text>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px + 13px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
