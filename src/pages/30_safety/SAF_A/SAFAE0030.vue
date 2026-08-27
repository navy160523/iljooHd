<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
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

defineOptions({
  name: "SAFCA0010",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const tab = ref("Dashboard")

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {},
  keys: ["YEAR", "INSERT_DATE", "INSERT_EMP_NM", "CNFM_DATE"],
  fields: [
    { fieldName: "COL1", dataType: "text", header: { text: t("발생일시") } },
    { fieldName: "COL2", dataType: "text", header: { text: t("재해조직명") } },
    { fieldName: "COL3", dataType: "text", header: { text: t("책임부서명") } },
    { fieldName: "COL4", dataType: "text", header: { text: t("업체명") } },
    { fieldName: "COL5", dataType: "text", header: { text: t("책임") } },
    { fieldName: "COL6", dataType: "text", header: { text: t("공정") } },
    { fieldName: "COL7", dataType: "text", header: { text: t("사고구분") } },
    { fieldName: "COL8", dataType: "text", header: { text: t("사고형태") } },
    { fieldName: "COL9", dataType: "text", header: { text: t("진행상태") } },
    { fieldName: "COL10", dataType: "text", header: { text: t("사고개요") } },
    { fieldName: "COL11", dataType: "text", header: { text: t("재해자") } },
    { fieldName: "COL12", dataType: "text", header: { text: t("처리구분") } },
    { fieldName: "COL13", dataType: "text", header: { text: t("소속구분") } },
    { fieldName: "COL14", dataType: "text", header: { text: t("사번") } },
    { fieldName: "COL15", dataType: "text", header: { text: t("소속조직명") } },
    { fieldName: "COL16", dataType: "text", header: { text: t("업체명") } },
    { fieldName: "COL17", dataType: "text", header: { text: t("직급") } },
    { fieldName: "COL18", dataType: "text", header: { text: t("연령 (만)") } },
    { fieldName: "COL19", dataType: "text", header: { text: t("생년월일") } },
    { fieldName: "COL20", dataType: "text", header: { text: t("입사일자") } },
    { fieldName: "COL21", dataType: "text", header: { text: t("직종") } },
    { fieldName: "COL22", dataType: "text", header: { text: t("상해부위 대") } },
    { fieldName: "COL23", dataType: "text", header: { text: t("상해부위 소") } },
    { fieldName: "COL24", dataType: "text", header: { text: t("상해종류") } },
    { fieldName: "COL25", dataType: "text", header: { text: t("연락처(HP)") } },
    { fieldName: "COL26", dataType: "text", header: { text: t("진단(주)") } },
    { fieldName: "COL27", dataType: "text", header: { text: t("손실일수") } },
    { fieldName: "COL28", dataType: "text", header: { text: t("총무부접수일") } },
    { fieldName: "COL29", dataType: "text", header: { text: t("산재승인일") } },
    { fieldName: "COL30", dataType: "text", header: { text: t("휴직일") } },
    { fieldName: "COL31", dataType: "text", header: { text: t("복직일") } },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 데이터 입력
const data = [
  {
    COL1: "2023/08/04",
    COL2: "조선해양사업부",
    COL3: "안전경영부 ",
    COL4: "(주)덕신",
    COL5: "",
    COL6: "",
    COL7: "골절",
    COL8: "떨어짐",
    COL9: "진행중",
    COL10: "",
    COL11: "고길동",
    COL12: "",
    COL13: "",
    COL14: "20101412",
    COL15: "팔란티어추진팀",
    COL16: "(주)일주지앤에스",
    COL17: "책임",
    COL18: "39",
    COL19: "1984.02.02",
    COL20: "2010/05/25",
    COL21: "",
    COL22: "",
    COL23: "",
    COL24: "",
    COL25: "",
    COL26: "",
    COL27: "",
    COL28: "",
    COL29: "",
    COL30: "",
    COL31: "",
  },
  {
    COL1: "2023/05/12",
    COL2: "조선해양사업부",
    COL3: "안전경영부 ",
    COL4: "(주)덕신",
    COL5: "",
    COL6: "",
    COL7: "골절",
    COL8: "오토바이 사고",
    COL9: "진행중",
    COL10: "",
    COL11: "강감찬",
    COL12: "",
    COL13: "",
    COL14: "20071412",
    COL15: "팔란티어추진팀",
    COL16: "(주)일주지앤에스",
    COL17: "책임",
    COL18: "37",
    COL19: "1986.02.02",
    COL20: "2010/05/25",
    COL21: "",
    COL22: "",
    COL23: "",
    COL24: "",
    COL25: "",
    COL26: "",
    COL27: "",
    COL28: "",
    COL29: "",
    COL30: "",
    COL31: "",
  },
]

onMounted(() => {
  grdMain.value.getDataProvider().setRows(data)
})

//메뉴버튼
const onButtonsClick = (btn) => {}
</script>

<template>
  <div>
    <VContainer class="pt-0">
      <VRow>
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            :title="$t(useLogsStore().menuId)"
            :button-list="['btnSearch']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <!-- 조회조건 -->
      <VRow no-gutters>
        <VCol>
          <VForm ref="searchArea" class="searchArea">
            <VRow>
              <VCol cols="12" md="3">
                <ILabel :label="$t('발생기간')" label-width="100" :required="true">
                  <template #editor="editorProps">
                    <VRow>
                      <VCol>
                        <VTextField type="date" />
                      </VCol>
                      <VCol>
                        <VTextField type="date" />
                      </VCol>
                    </VRow>
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="2">
                <ILabel :label="$t('사업부')" label-width="80">
                  <template #editor="editorProps">
                    <VAutocomplete :items="['전체']" value="전체" />
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="2">
                <ILabel :label="$t('재해부서')" label-width="100">
                  <template #editor="editorProps">
                    <VTextField append-inner-icon="mdi-magnify" />
                  </template>
                </ILabel>
              </VCol>
              <VCol cols="12" md="4">
                <ILabel :label="$t('통계제외분')" label-width="110" :required="true">
                  <template #editor="editorProps">
                    <v-radio-group inline v-model="radios">
                      <v-radio label="제외" value="one"></v-radio>
                      <v-radio label="포함" value="two"></v-radio>
                    </v-radio-group>
                  </template>
                </ILabel>
              </VCol>
            </VRow>
          </VForm>
        </VCol>
      </VRow>
      <!-- 메인그리드 -->
      <VRow no-gutters>
        <VCol>
          <IGridTitle :title="$t('')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 650px"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
