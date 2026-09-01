/**
 * The Volunteer Agreement (Acordo de Voluntariado) the tool generates when
 * neither the role nor the `residency` config carries one of its own.
 *
 * It is drafted under the Portuguese volunteering framework: a volunteering
 * relationship, not employment; support in kind under the gratuitidade
 * principle rather than pay; free to end on either side without penalty; and a
 * community token allocation that is discretionary, uncalculated and worth
 * nothing on any market. Those are the clauses that make the rest of the page
 * legally coherent — edit the wording in Admin → Config → Residency, but keep
 * what clauses 1.1, 4.2, 7.2, 7.5 and 12.2 say.
 *
 * Both languages are in one body on purpose: it is signed bilingually, and the
 * Portuguese version prevails (clause 13.2). The association's own particulars
 * — NIPC, registered office, signatory, privacy contact, coordinator, insurer
 * — come off the `residency` config and render as a visible "[•]" until they
 * are filled in. The bracketed blanks that remain are the volunteer's own
 * identification, completed at signing. Placeholders in double braces are
 * filled from the live season by `renderAgreement`; an unknown one is left
 * visible rather than blanked, so a typo shows up instead of emptying a
 * clause.
 *
 * Reviewed by Portuguese counsel before first use.
 */
export const RESIDENCY_AGREEMENT_TEMPLATE = `# Volunteer Agreement · Acordo de Voluntariado

**{{associationName}} × {{volunteerName}}**
Environmental Volunteer Program · Programa de Voluntariado Ambiental
{{roleTitle}} — {{seasonLabel}}

Concluded under {{legalFramework}} · Celebrado ao abrigo da {{legalFramework}}

Agreement version {{agreementVersion}} · generated {{generatedOn}}. The Portuguese version prevails (clause 13.2) · A versão portuguesa prevalece (cláusula 13.2).

## Between the parties · Entre as partes

**{{associationName}}**, a Portuguese non-profit environmental association, NIPC {{associationTaxNumber}}, with registered office at {{associationAddress}}, herein represented by {{signatoryName}}, in the capacity of {{signatoryOffice}}, with powers for this act, hereinafter the **Association** (organização promotora);

**{{associationName}}**, associação sem fins lucrativos de âmbito ambiental, NIPC {{associationTaxNumber}}, com sede em {{associationAddress}}, neste ato representada por {{signatoryName}}, na qualidade de {{signatoryOffice}}, com poderes para o ato, adiante designada **Associação** (organização promotora);

and · e

**{{volunteerName}}**, of [nationality] nationality, holder of identification document no. [•], tax number (NIF) [•, if any], resident at [address], contact [email / phone], hereinafter the **Volunteer**.

**{{volunteerName}}**, de nacionalidade [•], titular do documento de identificação n.º [•], NIF [•, se aplicável], residente em [morada], contacto [email / telefone], adiante designado(a) **Voluntário(a)**.

## Whereas · Considerando que

A. The Association pursues environmental protection, land restoration, ecosystem regeneration and environmental education, and promotes volunteering in that domain as an organização promotora within the meaning of {{legalFramework}}.

A. A Associação prossegue fins de proteção do ambiente, restauro da paisagem, regeneração de ecossistemas e educação ambiental, e promove o voluntariado nesse domínio enquanto organização promotora na aceção da {{legalFramework}}.

B. The Volunteer freely wishes to take part in the Association's environmental volunteer program, in a spirit of solidarity and community interest, without any intention of employment or remuneration.

B. O(A) Voluntário(a) deseja, de forma livre, participar no programa de voluntariado ambiental da Associação, num espírito de solidariedade e de interesse comunitário, sem qualquer intenção de emprego ou remuneração.

C. The parties wish to record the terms of this participation, the support provided so that volunteering costs the Volunteer nothing, and the rights and duties arising from the legal framework of volunteering.

C. As partes pretendem registar os termos desta participação, o apoio prestado para que o voluntariado nada custe ao(à) Voluntário(a), e os direitos e deveres decorrentes do enquadramento jurídico do voluntariado.

## 1. Legal framework and purpose · Enquadramento legal e objeto

1.1. This agreement establishes a volunteering relationship under {{legalFramework}}. It does not create, and the parties do not intend, any employment relationship, service contract or other form of paid work.

1.1. O presente acordo estabelece uma relação de voluntariado ao abrigo da {{legalFramework}}. Não cria, nem as partes pretendem criar, qualquer relação de trabalho subordinado, contrato de prestação de serviços ou outra forma de trabalho remunerado.

1.2. The Volunteer joins the Association's environmental volunteer program (the Program), contributing to activities of environmental protection, land restoration, regenerative agriculture, environmental education and related community life, in the community interest.

1.2. O(A) Voluntário(a) integra o programa de voluntariado ambiental da Associação (o Programa), contribuindo para atividades de proteção ambiental, restauro da paisagem, agricultura regenerativa, educação ambiental e vida comunitária associada, no interesse da comunidade.

## 2. Volunteer program and activities · Programa de voluntariado e atividades

2.1. The Volunteer's activities, season dates, focus areas and coordinator are described in Annex I (Volunteer Program), which forms part of this agreement.

2.1. As atividades do(a) Voluntário(a), as datas da época, as áreas de intervenção e a pessoa coordenadora constam do Anexo I (Programa de Voluntariado), que faz parte integrante deste acordo.

2.2. The activities are carried out in a spirit of complementarity with the work of the Association's staff and contractors, and do not replace paid professional work.

2.2. As atividades são exercidas num espírito de complementaridade com o trabalho dos profissionais e prestadores da Associação, não os substituindo.

2.3. The Association provides the orientation, initial and ongoing training, tools and materials needed for the activities, at no cost to the Volunteer.

2.3. A Associação assegura o enquadramento, a formação inicial e contínua, as ferramentas e os materiais necessários às atividades, sem qualquer custo para o(a) Voluntário(a).

## 3. Participation · Participação

3.1. Participation is flexible and indicative: up to {{halfDaysPerWeek}} half-days per week, arranged between the Volunteer and the Program coordinator around the Volunteer's availability and the seasonal rhythm of the land.

3.1. A participação é flexível e indicativa: até {{halfDaysPerWeek}} meios-dias por semana, combinados entre o(a) Voluntário(a) e a pessoa coordenadora do Programa, em função da disponibilidade do(a) Voluntário(a) e do ritmo sazonal da terra.

3.2. The Volunteer freely manages their remaining time. Evenings and weekends are the Volunteer's own, and participation in any given activity is voluntary.

3.2. O(A) Voluntário(a) gere livremente o seu restante tempo. As noites e os fins de semana pertencem ao(à) Voluntário(a), e a participação em cada atividade concreta é voluntária.

3.3. The coordinator's role is to coordinate and support, not to direct the Volunteer in a relationship of subordination.

3.3. O papel da pessoa coordenadora é coordenar e apoiar, e não dirigir o(a) Voluntário(a) numa relação de subordinação.

## 4. Support in kind · Apoio em espécie

4.1. So that the Volunteer is not burdened with the costs of participating, the Association provides, free of charge and for the duration of the Program: shared accommodation on site ({{includedAccommodation}}), meals, and use of common facilities and utilities.

4.1. Para que o voluntariado nada custe ao(à) Voluntário(a), a Associação disponibiliza, gratuitamente e durante o Programa: alojamento partilhado no local ({{includedAccommodation}}), refeições e utilização dos espaços comuns e utilidades.

4.2. This support constitutes coverage of the Volunteer's participation expenses under the gratuitidade principle of {{legalFramework}}. It is not remuneration, salary, payment in kind for work, or consideration of any sort, and no monetary value is owed in its place.

4.2. Este apoio constitui cobertura das despesas de participação do(a) Voluntário(a), em conformidade com o princípio da gratuitidade da {{legalFramework}}. Não constitui remuneração, salário, pagamento em espécie por trabalho, nem contrapartida de qualquer natureza, e nenhum valor monetário é devido em sua substituição.

4.3. Optional upgrades (for example a private room) are personal purchases by the Volunteer at the posted rates, payable in euros or by spending {{tokenSymbol}} tokens the Volunteer already holds. Choosing or declining an upgrade has no effect on participation in the Program. Upgrade chosen: {{upgradeLine}}.

4.3. As melhorias opcionais (por exemplo, quarto privado) são compras pessoais do(a) Voluntário(a) aos preços publicados, pagáveis em euros ou mediante utilização de tokens {{tokenSymbol}} de que o(a) Voluntário(a) já seja titular. A escolha ou recusa de uma melhoria não afeta a participação no Programa. Melhoria escolhida: {{upgradeLine}}.

## 5. Expenses · Despesas

5.1. Expenses incurred by the Volunteer at the Association's request or with its prior approval (for example approved travel or materials) are reimbursed against receipts.

5.1. As despesas suportadas pelo(a) Voluntário(a) a pedido da Associação ou com a sua aprovação prévia (por exemplo, deslocações ou materiais aprovados) são reembolsadas contra apresentação de comprovativos.

5.2. Reimbursement covers documented actual expenses only and does not depend on the length of the Volunteer's participation.

5.2. O reembolso abrange apenas despesas reais documentadas e não depende da duração da participação do(a) Voluntário(a).

## 6. Insurance, identification and social protection · Seguro, identificação e proteção social

{{insuranceClause}}

{{insuranceClausePt}}

6.2. If the Volunteer is not covered by a mandatory social security regime, the Association will inform and support the Volunteer regarding enrollment in the seguro social voluntário.

6.2. Caso o(a) Voluntário(a) não esteja abrangido(a) por um regime obrigatório de segurança social, a Associação informará e apoiará o(a) Voluntário(a) quanto ao enquadramento no seguro social voluntário.

6.3. The Association ensures safe and healthy conditions for the activities, including appropriate guidance and protective equipment where relevant.

6.3. A Associação assegura condições de higiene e segurança no exercício das atividades, incluindo orientação adequada e equipamento de proteção quando relevante.

## 7. Community records and tokens · Registos comunitários e tokens

7.1. The community keeps digital records of participation: $Presence (days present on the land) and $Sweat (a record of contribution used for community recognition and governance weight).

7.1. A comunidade mantém registos digitais de participação: $Presence (dias de presença na terra) e $Sweat (registo de contribuição utilizado para reconhecimento comunitário e peso de governação).

7.2. These records carry no right to payment, salary or any economic consideration, and do not accrue or convert into money by reason of volunteering.

7.2. Estes registos não conferem direito a pagamento, salário ou qualquer contrapartida económica, e não se convertem em dinheiro por força do voluntariado.

7.3. {{tokenSymbol}} is a utility token spendable on stays and services within the community. The Volunteer may spend {{tokenSymbol}} they already hold on optional upgrades (clause 4.3).

7.3. O {{tokenSymbol}} é um token de utilidade destinado a estadias e serviços dentro da comunidade. O(A) Voluntário(a) pode utilizar {{tokenSymbol}} de que já seja titular em melhorias opcionais (cláusula 4.3).

7.4. As a gesture of community membership, and at its sole discretion, the Association may allocate the Volunteer **{{tokensDistributed}} {{tokenSymbol}}** for this season ({{tokensDistributedMonthly}} per month). {{tokenSymbol}} has no liquid market and no ascertainable market value: the fair market value of this allocation is **{{tokenFairValue}}**.

7.4. Como gesto de pertença à comunidade, e por sua exclusiva decisão, a Associação pode atribuir ao(à) Voluntário(a) **{{tokensDistributed}} {{tokenSymbol}}** por esta época ({{tokensDistributedMonthly}} por mês). O {{tokenSymbol}} não tem mercado líquido nem valor de mercado apurável: o valor de mercado desta atribuição é de **{{tokenFairValue}}**.

7.5. This allocation is not remuneration, salary, payment in kind or consideration for the Volunteer's activities. It is not owed, is not calculated by reference to time given or work done, confers no right to payment in money, and may be varied or discontinued by the Association at any time without any claim arising. Nothing in this clause creates an employment or service relationship (clause 1.1).

7.5. Esta atribuição não constitui remuneração, salário, pagamento em espécie nem contrapartida pelas atividades do(a) Voluntário(a). Não é devida, não é calculada em função do tempo dedicado ou do trabalho realizado, não confere direito a pagamento em dinheiro, e pode ser alterada ou descontinuada pela Associação a todo o tempo sem que daí resulte qualquer direito. Nada nesta cláusula cria uma relação de trabalho ou de prestação de serviços (cláusula 1.1).

## 8. Health and illness · Saúde e doença

8.1. If unwell, the Volunteer should rest, inform the coordinator, and avoid communal indoor spaces and shared meals while symptomatic.

8.1. Em caso de doença, o(a) Voluntário(a) deve descansar, informar a pessoa coordenadora e evitar espaços interiores comuns e refeições partilhadas enquanto apresentar sintomas.

8.2. Illness never gives rise to charges. If the Volunteer is unable to take part for an extended period, the parties will talk in good faith about whether to pause or end the Program.

8.2. A doença nunca dá origem a encargos. Se o(a) Voluntário(a) ficar impossibilitado(a) de participar por período prolongado, as partes conversarão de boa-fé sobre a suspensão ou cessação do Programa.

8.3. The Volunteer agrees to follow safety guidance, to use the equipment provided, and to report immediately any injury, incident or unsafe condition.

8.3. O(A) Voluntário(a) compromete-se a seguir as orientações de segurança, a utilizar o equipamento disponibilizado e a comunicar de imediato qualquer lesão, incidente ou condição insegura.

## 9. Community conduct · Conduta comunitária

9.1. The Volunteer agrees to act in accordance with the community Code of Conduct (Annex II), to respect other community members, guests and neighbours, and to care for the land, property and infrastructure.

9.1. O(A) Voluntário(a) compromete-se a agir em conformidade com o Código de Conduta da comunidade (Anexo II), a respeitar os demais membros da comunidade, hóspedes e vizinhos, e a cuidar da terra, dos bens e das infraestruturas.

9.2. In case of serious breach of the Code of Conduct or conduct endangering the safety of others, the Association may end the Volunteer's participation with immediate effect, after hearing the Volunteer where circumstances allow.

9.2. Em caso de violação grave do Código de Conduta ou de conduta que ponha em perigo a segurança de terceiros, a Associação pode cessar a participação do(a) Voluntário(a) com efeito imediato, ouvido(a) o(a) Voluntário(a) sempre que as circunstâncias o permitam.

## 10. Confidentiality · Confidencialidade

10.1. The Volunteer agrees not to disclose to outside parties: (a) personal data of community members, residents, volunteers or guests; and (b) non-public financial, operational or strategic information of the Association.

10.1. O(A) Voluntário(a) compromete-se a não divulgar a terceiros: (a) dados pessoais de membros da comunidade, residentes, voluntários ou hóspedes; e (b) informação financeira, operacional ou estratégica da Associação que não seja pública.

10.2. This duty does not apply to information that is or becomes public without breach, was lawfully known to the Volunteer beforehand, or must be disclosed by law, court order or to a competent authority, including protected reporting of irregularities.

10.2. Este dever não se aplica a informação que seja ou se torne pública sem violação, que fosse licitamente conhecida do(a) Voluntário(a) previamente, ou cuja divulgação seja exigida por lei, decisão judicial ou autoridade competente, incluindo a denúncia protegida de irregularidades.

10.3. The duty in 10.1(b) lasts for three (3) years after the end of the Program. Duties regarding personal data continue for as long as the applicable law provides.

10.3. O dever previsto em 10.1(b) vigora por três (3) anos após o termo do Programa. Os deveres relativos a dados pessoais mantêm-se pelo período previsto na lei aplicável.

## 11. Personal data · Dados pessoais

11.1. The Association processes the Volunteer's personal data (identification, contacts, program and insurance records) as controller, for the purposes of managing the Program, complying with legal obligations and providing insurance, under the GDPR.

11.1. A Associação trata os dados pessoais do(a) Voluntário(a) (identificação, contactos, registos do programa e do seguro) na qualidade de responsável pelo tratamento, para gestão do Programa, cumprimento de obrigações legais e contratação do seguro, ao abrigo do RGPD.

11.2. Data is kept only as long as necessary for those purposes and applicable legal periods. The Volunteer may exercise the rights of access, rectification, erasure, restriction, portability and objection by writing to {{privacyContactEmail}}. Complaints may be addressed to the CNPD.

11.2. Os dados são conservados apenas pelo tempo necessário a essas finalidades e pelos prazos legais aplicáveis. O(A) Voluntário(a) pode exercer os direitos de acesso, retificação, apagamento, limitação, portabilidade e oposição, escrevendo para {{privacyContactEmail}}. Pode apresentar reclamação à CNPD.

## 12. Duration and ending participation · Duração e cessação da participação

12.1. The Program runs from {{startDate}} to {{endDate}} ({{months}} month(s), {{days}} days — the season identified in Annex I).

12.1. O Programa decorre de {{startDate}} a {{endDate}} ({{months}} mês(es), {{days}} dias — a época identificada no Anexo I).

12.2. Volunteering is freely undertaken and freely ended. Either party may end participation at any time, without penalty and without owing compensation. As a courtesy to the community, the parties will aim to give {{noticeWeeks}} weeks' notice where possible.

12.2. O voluntariado é livremente assumido e livremente cessado. Qualquer das partes pode fazer cessar a participação a todo o tempo, sem penalidade e sem dever de indemnização. Por cortesia para com a comunidade, as partes procurarão dar um pré-aviso de {{noticeWeeks}} semanas sempre que possível.

12.3. On the end of participation, for whatever reason, the support in clause 4 ceases and the Volunteer returns any equipment and vacates the accommodation within a reasonable period agreed with the coordinator.

12.3. Cessando a participação, por qualquer motivo, cessa o apoio previsto na cláusula 4, devendo o(a) Voluntário(a) devolver o equipamento e desocupar o alojamento num prazo razoável acordado com a pessoa coordenadora.

## 13. General provisions · Disposições gerais

13.1. This agreement is governed by Portuguese law. The parties will seek to resolve any disagreement amicably and in dialogue before resorting to any other means; failing that, the courts of {{jurisdiction}} have jurisdiction.

13.1. Este acordo rege-se pela lei portuguesa. As partes procurarão resolver qualquer divergência de forma amigável e em diálogo antes de recorrer a outros meios; na sua falta, é competente o tribunal de {{jurisdiction}}.

13.2. This agreement is signed in English and Portuguese. In case of divergence, the Portuguese version prevails.

13.2. Este acordo é assinado em inglês e português. Em caso de divergência, prevalece a versão portuguesa.

13.3. If any provision is held invalid, the remaining provisions stay in force, and the parties will replace the invalid provision with a valid one closest to its purpose.

13.3. Se alguma disposição for considerada inválida, as restantes mantêm-se em vigor, comprometendo-se as partes a substituir a disposição inválida por outra válida que mais se aproxime do seu propósito.

13.4. This agreement and its Annexes contain the parties' full understanding regarding the Program and may only be amended in writing signed by both parties.

13.4. Este acordo e os seus Anexos contêm o entendimento integral das partes quanto ao Programa e só podem ser alterados por escrito assinado por ambas as partes.

## Annex I · Volunteer Program / Anexo I · Programa de Voluntariado

- Season / Época: **{{seasonLabel}}** · {{startDate}} → {{endDate}}
- Role / Função: **{{roleTitle}}**
- Coordinator / Coordenação: {{coordinatorContact}}
- Indicative rhythm / Ritmo indicativo: up to **{{halfDaysPerWeek}} half-days per week** / até **{{halfDaysPerWeek}} meios-dias por semana**
- Accommodation provided / Alojamento disponibilizado: **{{includedAccommodation}}**
- Optional upgrade chosen / Melhoria opcional escolhida: **{{upgradeLine}}**
- Community allocation / Atribuição comunitária: **{{tokensDistributed}} {{tokenSymbol}}** · fair market value / valor de mercado: **{{tokenFairValue}}**
- Training provided / Formação assegurada: site orientation, tool safety, first aid location, fire protocol / orientação do espaço, segurança de ferramentas, localização de primeiros socorros, protocolo de incêndio
- Accident insurance policy / Apólice de seguro de acidentes: {{insuranceAnnexLine}}
- Volunteer ID card / Cartão de identificação: issued on arrival / emitido à chegada

Focus areas / Áreas de intervenção:

{{focusAreas}}

Community life / Vida comunitária:

{{communityDuties}}

Annex II · Code of Conduct / Anexo II · Código de Conduta: attached as a separate document and acknowledged by the Volunteer / anexado como documento autónomo e do conhecimento do(a) Voluntário(a).

---

Done at {{platformName}}, on {{generatedOn}}, in two originals · Feito em {{platformName}}, em {{generatedOn}}, em dois exemplares.

For the Association / Pela Associação: {{signatoryName}}, {{signatoryOffice}}
The Volunteer / O(A) Voluntário(a): {{volunteerName}}

Agreement version {{agreementVersion}} · {{legalFramework}} · EN + PT
`;
