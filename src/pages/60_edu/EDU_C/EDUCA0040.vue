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
  name: 'EDUCA0040',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const result = ref(`
리더십이 높은 반면 안전의식이 낮은 경우 공감대를 형성하지 못한 리더십이 조직에 작용하고 있다는 것을 의미합니다. 
보통 강압적이거나 일방적인 지시를 많이 하는 관리감독자가 많은 조직에서 나타나는 형태라고 할 수 있으며, 
관리감독자와 직원의 리더십과 안전의식 영역의 간극이 클수록 문제 개선을 위한 더 많은 노력이 필요하다고 할 수 있습니다. 
`)
const activity = ref(`관리자 계층에서 안전목적의 현장방문 빈도를 높이고, 
직원들에게 다가가 칭찬하고 격려(소통)하는 노력과 활동이 필요합니다.
TBM과 같은 현장 조직의 소회의 시간을 활용하여 직원의 불만과 애로사항을 듣고 적극적으로 개선하는 활동이 필요합니다.
`)




//그리드 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { checkBar: { visible: true } },
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', header: {text:t('부서명')}, },
    { fieldName: 'COL2', dataType: 'text', header: {text:t('상관관계 배정 여부')}, },
    { fieldName: 'COL3', dataType: 'text', header: {text:t('개선계획 등록 여부')}, },
    { fieldName: 'COL4', dataType: 'text', header: {text:t('계획 안전 코멘트 등록')}, },
    { fieldName: 'COL5', dataType: 'text', header: {text:t('시행결과 등록여부')}, },
    { fieldName: 'COL6', dataType: 'text', header: {text:t('결과 안전 코멘트 등록')}, },
  ],
  columns:[],
})

grdProps1.columns = grdProps1.fields

const data = [
  { COL1: '안전경영실',	COL2: 'CAD 개발부',	COL3: 'Y',	COL4: 'Y',	COL5: '',	COL6: 'Y'},
  { COL1: '통합안전교육센터',	COL2: 'CHS 공사부',	COL3: 'N',	COL4: 'Y',	COL5: '',	COL6: 'N'},
  { COL1: '',	COL2: 'EM부',	COL3: '',	COL4: '',	COL5: '',	COL6: ''}
]

onMounted(() => {
  grd1.value.getDataProvider().setRows(data)
})
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
            :button-list="['btnSearch']"
          />
        </VCol>
      </VRow>

      <!-- 조회조건 -->
      <VRow>
        <VCol>
          <VForm
            ref="searchArea"
            class="searchArea"
          >
            <VRow>  
              <VCol
                cols="12"
                md="3"
              >
                <ILabel
                  :label="$t('연도')"
                  label-width="150"
                >
                  <template #editor="editorProps">
                    <VTextField
                    />
                  </template> 
                </ILabel>
              </VCol>  
              <VCol
                cols="12"
                md="3"
              >  
                <ILabel
                  :label="$t('영역')"
                  label-width="150"
                >
                  <template #editor="editorProps">
                    <VAutocomplete
                    :items="['전체']" 
                    value="전체"
                    />
                  </template> 
                </ILabel>
              </VCol>
            <VCol
                cols="12"
                md="3"
              >  
                <ILabel
                  :label="$t('정보 등록 여부')"
                  label-width="150"
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
      <!-- /조회조건 -->

      <!-- 메인그리드 -->
      <VRow>
        <VCol cols="6" md="6">
          <IGridTitle :title="$t('상관관계 리스트')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grd1"
            class="mt-2"
            height="700"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys" 
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
          />
        </VCol>
      <VCol cols="6" md="6">
    <VRow style="height:200px" class="mt-5">
      <VCol cols="3" align="center" align-self="center" outlined>
        분석결과     
    </VCol>
      <VCol class="pa-4">
        <v-textarea 
          readonly
          :model-value=result
          style="height:100%"
        ></v-textarea> 
      </VCol>
    </VRow>
    <VRow style="height:100px"></VRow>
      <VRow style="height:200px">
      <VCol cols="3" align="center" align-self="center" >
          개선활동
      </VCol>
      <VCol class="pa-4">
        <v-textarea
          readonly
          :model-value=result
          style="height:100%"
        ></v-textarea> 
      </VCol>
    </VRow>
          </VCol>
      </VRow>
      <!-- /메인그리드 -->
    </VContainer>
  </div>
</template>

<style scoped>
/* 우측 텍스트 에리아 왼쪽에 있는텍스트 정렬 클래스 */
.sortText{ 
  display:flex;
  justify-content: center;
  align-items: center;
}
</style>