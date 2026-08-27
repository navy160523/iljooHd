<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'

defineOptions({
  name:'SAFCA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const tab = ref('Dashboard')

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {},
  keys : ['YEAR','INSERT_DATE','INSERT_EMP_NM','CNFM_DATE'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: { text: t('진행상태') } },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('협의여부') } },
    { fieldName: 'COL3', dataType: 'text', header: { text: t('승인여부') } },
    { fieldName: 'COL4', dataType: 'text', header: { text: t('파일번호') } },
    { fieldName: 'COL5', dataType: 'text', header: { text: t('메일발송여부') } },
    { fieldName: 'COL6', dataType: 'text', header: { text: t('산재구분') } },
    { fieldName: 'COL7', dataType: 'text', header: { text: t('재직구분') } },
    { fieldName: 'COL8', dataType: 'text', header: { text: t('사업부') } },
    { fieldName: 'COL9', dataType: 'text', header: { text: t('부서명') } },
    { fieldName: 'COL10', dataType: 'text', header: { text: t('사번') } },
    { fieldName: 'COL11', dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'COL12', dataType: 'text', header: { text: t('주민번호') } },
    { fieldName: 'COL13', dataType: 'text', header: { text: t('재해일자') } },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//그리드 데이터 입력
const data = [
  { COL1: '진행중',	COL2: 'N',	COL3: 'N ',	COL4: '001',	COL5: 'Y',	COL6: '산재',	COL7: '재직중',	COL8: '안전통합경영실',	COL9: '안전경영부',	COL10: 'A502342',	COL11: '',	COL12: '123456-1234567',	COL13: '2023/10/15' },
  { COL1: '진행중',	COL2: 'N',	COL3: 'N ',	COL4: '002',	COL5: 'Y',	COL6: '산재',	COL7: '재직중',	COL8: '조선해양사업부',	COL9: '개발설계1부',	COL10: 'A55215',	COL11: '',	COL12: '123456-1234567',	COL13: '2023/08/02' },
  { COL1: '진행중',	COL2: 'N',	COL3: 'N ',	COL4: '003',	COL5: 'N',	COL6: '산재',	COL7: '재직중',	COL8: '안전통합경영실',	COL9: '안전경영부',	COL10: 'A102842',	COL11: '',	COL12: '123456-1234567',	COL13: '2023/02/10' },
  { COL1: '진행중',	COL2: 'N',	COL3: 'Y ',	COL4: '004',	COL5: 'N',	COL6: '산재',	COL7: '재직중',	COL8: '조선해양사업부',	COL9: '기술기획부',	COL10: 'A56401',	COL11: '',	COL12: '123456-1234567',	COL13: '2023/02/10' },
  { COL1: '진행중',	COL2: 'N',	COL3: 'Y ',	COL4: '005',	COL5: 'Y',	COL6: '산재',	COL7: '재직중',	COL8: '안전통합경영실',	COL9: '안전경영부',	COL10: 'A20041',	COL11: '',	COL12: '123456-1234567',	COL13: '2023/02/10' },
]

onMounted(() => {
  grdMain.value.getDataProvider().setRows(data)
})

//메뉴버튼
const onButtonsClick = btn => {

}
</script>

<template>
  <div>
    <VContainer
      class="pt-0"
    >
      <VRow>
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            :title="$t(useLogsStore().menuId)"
            :button-list="['btnSearch', 'btnUpdate', 'btnReqApply', 'btnPrint', 'btnCopy']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <!-- tab -->
      <VTabs v-model="tab">
        <VTab value="Dashboard">Dashboard</VTab>
        <VTab value="Dashboard">상세정보</VTab>
      </VTabs>
      <VWindow v-model="tab">
        <VWindowItem value="Dashboard">
          <!-- 조회조건 -->
          <VRow no-gutters>
            <VCol>
              <VForm
                ref="searchArea"
                class="searchArea"
              >
                <VRow>
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('회사')"
                      label-width="80"
                      :required="true"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete 
                          :items="['HD현대중공업']"
                          value="HD현대중공업"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('진행상태')"
                      label-width="100"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete 
                          :items="['전체','진행중','진행중지']"
                          value="전체"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="6">
                    <ILabel
                      :label="$t('검색기간')"
                      label-width="100"
                      :required="true"
                    >
                      <template #editor="editorProps">
                        <VRow>
                          <VCol cols="12" md="5">
                            <VAutocomplete 
                              :items="['승인일/종결(예정)일']"
                              value="승인일/종결(예정)일"
                            />
                          </VCol>
                          <VCol>
                            <VTextField type="date"/>
                          </VCol>
                          <VCol>
                            <VTextField type="date"/>
                          </VCol>
                        </VRow>
                      </template>      
                    </ILabel>
                  </VCol>
                </VRow>
                <VRow>
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('사업부')"
                      label-width="80"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete 
                          :items="['전체']"
                          value="전체"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('부서')"
                      label-width="100"
                    >
                      <template #editor="editorProps">
                        <VTextField append-inner-icon="mdi-magnify" />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('재해자')"
                      label-width="100"
                    >
                      <template #editor="editorProps">
                        <VTextField append-inner-icon="mdi-magnify" />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('승인여부')"
                      label-width="100"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete 
                          :items="['전체']"
                          value="전체"
                        />
                      </template>      
                    </ILabel>
                  </VCol>
                  <VCol cols="12" md="2">
                    <ILabel
                      :label="$t('산재구분')"
                      label-width="100"
                    >
                      <template #editor="editorProps">
                        <VAutocomplete 
                          :items="['전체']"
                          value="전체"
                        />
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
                style="height: 650px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys" 
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
              />
            </VCol>
          </VRow>
        </VWindowItem>
        <VWindowItem value="상세"> 상세정보 </VWindowItem>
      </VWindow>
    </VContainer>
  </div>
</template>
  
