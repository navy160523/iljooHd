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
  name:'SAFDA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grd1 = ref(null)

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : {},
  keys : ['COL1'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: { text: t('진행상태') } },
    { fieldName: 'COL2', dataType: 'text', header: { text: t('위반일시') } },
    { fieldName: 'COL3', dataType: 'text', header: { text: t('소속구분') } },
    { fieldName: 'COL4', dataType: 'text', header: { text: t('위반조직') } },
    { fieldName: 'COL5', dataType: 'text', header: { text: t('사외협력사') } },
    { fieldName: 'COL6', dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'COL7', dataType: 'text', header: { text: t('구분') } },
    { fieldName: 'COL8', dataType: 'text', header: { text: t('장소') } },
    { fieldName: 'COL9', dataType: 'text', header: { text: t('내용') } },
    { fieldName: 'COL10', dataType: 'text', header: { text: t('단속자') } },
    { fieldName: 'COL11', dataType: 'text', header: { text: t('단속자 조직') } },
    { fieldName: 'COL12', dataType: 'text', header: { text: t('위반첨부') } },
    { fieldName: 'COL13', dataType: 'text', header: { text: t('조치첨부') } },
    { fieldName: 'COL14', dataType: 'text', header: { text: t('호선 No.') } },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력
const data = [
  { COL1: '진행중',	COL2: '2023-09-01', COL3: '사내', COL4: '안전통합경영실-설비기획부', COL5: '', COL6: '위반자', COL7: '절대수칙', COL8: '1도크', COL9: '안전장비 미착용', 
    COL10: '단속자', COL11: '안전통합경영실-조선안전부-내업안전2과-내업안전2팀', COL12: '', COL13: '', COL14: '' },
  { COL1: '진행중',	COL2: '2023-10-15', COL3: '사내', COL4: '조선해양사업부-LNG공사부-현진이엔지(주)', COL5: '', COL6: '위반자', COL7: '일반수칙', COL8: '4안벽', COL9: '안전장비 미착용', 
    COL10: '단속자', COL11: '안전통합경영실-조선안전부-내업안전2과-내업안전2팀', COL12: '', COL13: '', COL14: '' },
  { COL1: '진행중',	COL2: '2023-07-05', COL3: '사내', COL4: '조선해양사업부-대조립3부-(주)재일', COL5: '', COL6: '위반자', COL7: '기타', COL8: '8도크', COL9: '안전장비 미착용', 
    COL10: '단속자', COL11: '안전통합경영실-조선안전부-내업안전2과-내업안전2팀', COL12: '', COL13: '', COL14: '' },
]

onMounted(() => {
  grd1.value.getDataProvider().setRows(data)
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
            :button-list="['btnSearch', 'btnCreate', 'btnDelete']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <!-- 조회조건 -->
      <VRow no-gutters>
        <VCol>
          <VForm
            ref="searchArea"
            class="searchArea"
          >
            <VRow>
              <VCol cols="12" md="4">
                <ILabel
                  :label="$t('일자 :')"
                  label-width="80"
                  :required="true"
                >
                  <template #editor="editorProps">
                    <VTextField type="date" />
                    <span class="pa-2"> ~ </span>
                    <VTextField type="date" />
                  </template>      
                </ILabel>
              </VCol>
              <VCol cols="12" md="3">
                <ILabel
                  :label="$t('사업부 :')"
                  label-width="100"
                >
                  <template #editor="editorProps">
                    <VAutocomplete
                      :items="['전체','조선해양사업부']"
                      value="전체"
                    />
                  </template>      
                </ILabel>
              </VCol>
              <VCol cols="12" md="3">
                <ILabel
                  :label="$t('부서 :')"
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
            <VRow>
              <VCol cols="12" md="2">
                <ILabel
                  :label="$t('구분 :')"
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
                  :label="$t('단속자 :')"
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
                  :label="$t('진행상태 :')"
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
      <VRow>
        <VCol>
          <IGridTitle 
            :title="$t('점검현황')"
          >
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grd1"
            class="mt-2"
            style="height: 600px;"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
          />
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
  
