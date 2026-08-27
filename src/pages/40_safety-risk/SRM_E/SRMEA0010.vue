<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import IGridTitle from "@/components/IGridTitle.vue";
import ILabel from "@/components/ILabel.vue";
import RealGrid from "@/components/RealGrid.vue";

defineOptions({
  name: "SRMEA0010",
});

const t = useI18n().t; //다국어
const menuTitle = ref(null);
const grd1 = ref(null);
</script>

<template>
  <div>
    <VContainer>
      <VRow>
        <IMenuTitle
          ref="menuTitle"
          title="설계 안전성 검토 의뢰/현황"
          :button-list="['btnSearch']"
          @click-button="onButtonsClick"
        />
      </VRow>
      <VRow>
        <!-- 조회조건 -->
        <VRow>
          <VCol>
            <VForm ref="searchArea" class="searchArea">
              <VRow>
                <VCol cols="2">
                  <ILabel :label="$t('출처')" label-width="70">
                    <template #editor="editorProps">
                      <VAutocomplete :items="['전체']" value="전체" />
                    </template>
                  </ILabel>
                </VCol>
                <VCol cols="2">
                  <ILabel :label="$t('진행현황')" label-width="70">
                    <template #editor="editorProps">
                      <VAutocomplete :items="['전체']" value="전체" />
                    </template>
                  </ILabel>
                </VCol>
                <VCol cols="2">
                  <ILabel :label="$t('등록기간')" label-width="70">
                    <template #editor="editorProps">
                      <VTextField type="text" />
                    </template>
                  </ILabel>
                </VCol>
                <VCol cols="2">
                  <ILabel :label="$t('사업부')" label-width="70">
                    <template #editor="editorProps">
                      <VTextField type="text" />
                    </template>
                  </ILabel>
                </VCol>
                <VCol cols="2">
                  <ILabel :label="$t('부문')" label-width="70">
                    <template #editor="editorProps">
                      <VTextField type="text" />
                    </template>
                  </ILabel>
                </VCol>
                <VCol cols="2">
                  <ILabel :label="$t('부서')" label-width="70">
                    <template #editor="editorProps">
                      <VTextField type="text" />
                    </template>
                  </ILabel>
                </VCol>
              </VRow>
            </VForm>
          </VCol>
        </VRow>
      </VRow>
    </VContainer>
  </div>
</template>
