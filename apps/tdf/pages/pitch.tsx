import Head from 'next/head';

import { Heading, Card } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';

const PitchPage = () => {
  return (
    <>
      <Head>
        <title>Traditional Dream Factory — Investment Memorandum Q1 2026</title>
        <meta
          name="description"
          content="€450,000 Private Debt Offering — Secured by equity in Enseada Sonhadora S.A."
        />
      </Head>
      <section className="bg-white">
        <div className="bg-gradient-to-br from-accent-light to-accent-alt-light border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-xs uppercase tracking-wider text-gray-600 mb-4 font-medium">
                Investment Memorandum
              </p>
              <Heading
                className="mb-4 text-4xl md:text-6xl"
                display
                level={1}
              >
                TRADITIONAL DREAM FACTORY
              </Heading>
              <p className="text-base text-gray-700 mb-8 leading-relaxed font-light max-w-2xl mx-auto">
                Europe&apos;s First Tokenized Regenerative Ecovillage
                <br />
                Abela, Alentejo, Portugal
              </p>
              <div className="text-lg font-semibold text-gray-900 mb-12">
                €450,000 Private Debt | 5% Annual Interest | 4-Year Term
                <br />
                <span className="text-base font-normal">Secured by SPV Equity | Token Conversion Option</span>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Executive Summary
              </Heading>
              <p className="text-base text-gray-700 mb-8 leading-relaxed font-light">
                Traditional Dream Factory (TDF) is raising €450,000 in private debt to complete construction of a 16-room rural tourism facility with farm-to-table restaurant in Alentejo, Portugal.
              </p>
              
              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-xl font-semibold mb-6 text-gray-900">
                  Key Investment Highlights
                </Heading>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <strong className="font-semibold text-gray-900">Security:</strong>
                      <span className="text-sm text-gray-700 ml-2 font-light">
                        Formal pledge over shares in Enseada Sonhadora S.A. (asset-holding SPV)
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-gray-900">Senior Financing:</strong>
                      <span className="text-sm text-gray-700 ml-2 font-light">
                        €700K bank mortgage in final approval (expected April 2026)
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-gray-900">Grant Pending:</strong>
                      <span className="text-sm text-gray-700 ml-2 font-light">
                        Up to €600K from Transição Justa (answer expected April 2026)
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-gray-900">Operational Proof:</strong>
                      <span className="text-sm text-gray-700 ml-2 font-light">
                        Break-even in 2025; 4,867 nights booked; 77% occupancy on existing beds
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-gray-900">Repayment:</strong>
                      <span className="text-sm text-gray-700 ml-2 font-light">
                        From operating cash flow + ongoing token sales; refinancing option at construction completion
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-gray-900">Upside:</strong>
                      <span className="text-sm text-gray-700 ml-2 font-light">
                        Optional conversion to $TDF tokens at 5% bonus
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <p className="text-base text-gray-700 leading-relaxed font-light">
                <strong className="font-semibold text-gray-900">Use of Proceeds:</strong> Complete construction (June–December 2026), enabling €650K+ annual revenue from 2028.
              </p>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                The Opportunity
              </Heading>
              
              <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                Rural Tourism & Community Living in Portugal
              </Heading>
              
              <div className="space-y-4 mb-8">
                <div>
                  <strong className="font-semibold text-gray-900">Market Demand:</strong>
                  <ul className="list-none mt-2 space-y-2">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        1M+ high-income expats moved to Portugal since 2020
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Insufficient supply of quality sustainable housing and hospitality
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Alentejo emerging as alternative to saturated Lisbon/Algarve markets
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <strong className="font-semibold text-gray-900">TDF&apos;s Position:</strong>
                  <ul className="list-none mt-2 space-y-2">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        76 hectares in Abela, Alentejo
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        1.5h from Lisbon international airport
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        35 min to pristine coastline
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Approved plans for rural tourism development
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <strong className="font-semibold text-gray-900">Why Now:</strong>
                  <ul className="list-none mt-2 space-y-2">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Construction-ready (plans approved)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Bank financing in final stages
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        EU grant submitted for up to €600K
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        280+ committed community members providing demand baseline
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                What We&apos;ve Built (2021–2025)
              </Heading>
              
              <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                Operational Track Record
              </Heading>

              <div className="mb-8">
                <strong className="font-semibold text-gray-900">Infrastructure Completed:</strong>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <ul className="list-none space-y-2">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">10 glamping tents (operational)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">8 volunteer beds (operational)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">Treehouse accommodation</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">Bio-pool & water temple</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">Nursery café</span>
                    </li>
                  </ul>
                  <ul className="list-none space-y-2">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">Mushroom farm (producing)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">Market garden & food forest</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">4,000+ trees planted</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">Event space (200+ capacity)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-xl font-semibold mb-6 text-gray-900">
                  2025 Operating Performance
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Nights Booked</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">4,867</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Glamping Occupancy</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">45.1%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Volunteer Bed Occupancy</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">77.1%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Events Hosted</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">14</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Event Attendees</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">358</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-700 font-light">Operating Result</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">Break-even</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="space-y-2">
                <p className="text-base text-gray-700 leading-relaxed font-light">
                  <strong className="font-semibold text-gray-900">Community & Capital:</strong>
                </p>
                <ul className="list-none space-y-2">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">
                      €1.2M+ raised from 280+ token holders since 2021
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">
                      60–70 active &quot;citizens&quot; (governance participants)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">
                      €120K token sales in 2025 alone (converting to equity)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                The Development
              </Heading>
              
              <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                What This Capital Builds
              </Heading>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                  Licensed Rural Tourism Facility
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Component</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Units</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Private Suites</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">12</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Plans approved, construction Q2–Q4 2026</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Studios</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">4</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Plans approved, construction Q2–Q4 2026</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Restaurant</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">30 seats</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Plans approved, construction Q2–Q4 2026</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Commercial Kitchen</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">1</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Plans approved</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-700 font-light">Co-working Space</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">1</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Plans approved</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                  Additional Accommodations (Unlicensed/Glamping)
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Units</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Large Glamping</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">6</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Operational</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Small Glamping</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">3</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Operational</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Treehouse</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">1</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Operational</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Silo Cabins</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">3</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Planned</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-700 font-light">Camping Spots</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">6</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Operational</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <p className="text-base text-gray-700 leading-relaxed font-light">
                <strong className="font-semibold text-gray-900">Post-Construction Capacity:</strong> 104 guests (retreats/events) or 35 rooms (co-living)
              </p>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Capital Stack
              </Heading>
              
              <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                Sources & Uses
              </Heading>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                  SOURCES OF FUNDS
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Source</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Terms</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Bank Mortgage</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€700,000</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Final approval (April 2026)</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Senior secured, 4.5%, 15yr</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Private Debt (This Raise)</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€450,000</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Open</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Subordinated, 5%, 4yr</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Token Sales 2026</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€150,000</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Ongoing</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Equity via OASA Association</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-700 font-light">Cash on Hand</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€160,000</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Available</td>
                        <td className="py-3 px-4 text-gray-700 font-light">—</td>
                      </tr>
                      <tr className="border-t-2 border-gray-900">
                        <td className="py-3 px-4 font-semibold text-gray-900">TOTAL</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">€1,460,000</td>
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 mt-4 font-light italic">
                  Note: €600K grant pending (Transição Justa) — excluded from base case as conservative assumption.
                </p>
              </Card>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                  USES OF FUNDS
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Use</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Land Acquisition</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€200,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Construction (Co-living + Restaurant)</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€850,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Equipment & FF&E</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€100,000</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-700 font-light">Working Capital & Contingency</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€310,000</td>
                      </tr>
                      <tr className="border-t-2 border-gray-900">
                        <td className="py-3 px-4 font-semibold text-gray-900">TOTAL</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">€1,460,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                The Investment
              </Heading>
              
              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-xl font-semibold mb-6 text-gray-900">
                  €450,000 Private Debt Terms
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Amount</td>
                        <td className="py-3 px-4 text-gray-700 font-light">€450,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Minimum Ticket</td>
                        <td className="py-3 px-4 text-gray-700 font-light">€50,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Interest Rate</td>
                        <td className="py-3 px-4 text-gray-700 font-light">5% per annum</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Interest Payment</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Accrued, paid at maturity (cash or tokens)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Term</td>
                        <td className="py-3 px-4 text-gray-700 font-light">4 years</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Security</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Formal pledge over shares in Enseada Sonhadora S.A.</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Priority</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Subordinated to bank mortgage; pari passu with existing €400K private debt</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Conversion Option</td>
                        <td className="py-3 px-4 text-gray-700 font-light">At investor&apos;s discretion, convert principal + interest to $TDF tokens at 5% bonus</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-gray-900">Target Close</td>
                        <td className="py-3 px-4 text-gray-700 font-light">May 2026</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <p className="text-base text-gray-700 leading-relaxed font-light">
                <strong className="font-semibold text-gray-900">Enseada Sonhadora S.A.</strong> is the special purpose vehicle that owns the land (upon purchase) and all buildings/improvements. OASA holds equity in the SPV.
              </p>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Repayment Mechanics
              </Heading>
              
              <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                How Investors Get Paid Back
              </Heading>

              <div className="space-y-4 mb-8">
                <div>
                  <strong className="font-semibold text-gray-900">Repayment Sources:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-2">
                    <li className="text-sm text-gray-700 leading-relaxed font-light">
                      <strong className="font-semibold">Operating Cash Flow</strong> — €650K+ annual revenue from 2028, generating €250K+ EBITDA
                    </li>
                    <li className="text-sm text-gray-700 leading-relaxed font-light">
                      <strong className="font-semibold">Token Sales</strong> — Ongoing sales convert to equity, freeing cash for debt service
                    </li>
                    <li className="text-sm text-gray-700 leading-relaxed font-light">
                      <strong className="font-semibold">Refinancing Option</strong> — Post-construction, asset value supports refinancing to retire private debt
                    </li>
                  </ol>
                </div>
              </div>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                  Projected Repayment Timeline
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Year</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Activity</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">Private Debt Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">2026</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Construction; no repayment</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€450,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">2027</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Operations begin H2; token conversions reduce principal</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">~€400,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">2028</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Cash flow positive; first cash repayments + conversions</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">~€250,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">2029</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Continued repayment</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">~€100,000</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-900 font-semibold">2030</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Full repayment or refinance</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                  From Financial Model — Cash Position
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Year</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">Closing Cash</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">2026</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€235,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">2027</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€238,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">2028</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€395,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">2029</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€627,000</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-900 font-semibold">2030</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€585,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 mt-4 font-light italic">
                  Cash accumulation supports debt service while maintaining operational buffer.
                </p>
              </Card>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Financial Projections
              </Heading>
              
              <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                Revenue & Profitability (2028–2032)
              </Heading>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">2028</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">2029</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">2030</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">2031</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">2032</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Revenue</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€652,866</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€701,130</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€752,346</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€800,814</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€843,452</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">EBITDA</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€246,351</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€287,423</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€331,317</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€372,331</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€407,380</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">EBITDA Margin</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">37.7%</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">41.0%</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">44.0%</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">46.5%</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">48.3%</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-700 font-light">Net Income</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€188,182</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€200,893</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€234,094</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€259,382</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€289,361</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                  Revenue Composition (2028)
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Stream</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Commercial Season (Hospitality + Restaurant)</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€371,828</td>
                        <td className="py-3 px-4 text-right text-gray-700 font-light">57%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Community Season (Token holder stays + utilities)</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€135,778</td>
                        <td className="py-3 px-4 text-right text-gray-700 font-light">21%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-700 font-light">Unique Accommodations (Glamping, treehouse, etc.)</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€115,260</td>
                        <td className="py-3 px-4 text-right text-gray-700 font-light">18%</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-700 font-light">Events & Other</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€30,000</td>
                        <td className="py-3 px-4 text-right text-gray-700 font-light">5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="space-y-2">
                <strong className="font-semibold text-gray-900">Key Assumptions:</strong>
                <ul className="list-none space-y-2">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">
                      Commercial season: 5 months (retreats, weddings, tourism)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">
                      Community season: 7 months (token holder residencies)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">
                      Year 1 occupancy: 55% (conservative)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">
                      Stabilized occupancy: 68%
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Sensitivity & Downside Protection
              </Heading>
              
              <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                Stress-Tested Model
              </Heading>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                  EBITDA Sensitivity (2028)
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900"></th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">ADR -15%</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">Base</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">ADR +15%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">Occupancy -10%</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€158,057</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€201,591</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€245,126</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">Occupancy Base</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€190,899</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€246,351</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€277,968</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-900 font-semibold">Occupancy +10%</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€223,741</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€267,275</td>
                        <td className="py-3 px-4 text-right text-gray-900 font-semibold">€310,810</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 mt-4 font-light italic">
                  Key Finding: Break-even maintained in ALL scenarios. Even worst case (-10% occupancy, -15% ADR) generates €158K EBITDA — sufficient to service debt.
                </p>
              </Card>

              <div className="space-y-2 mb-8">
                <strong className="font-semibold text-gray-900">Downside Protections:</strong>
                <ol className="list-decimal list-inside space-y-2">
                  <li className="text-sm text-gray-700 leading-relaxed font-light">
                    <strong className="font-semibold">Security:</strong> Formal pledge over SPV shares (land + buildings)
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light">
                    <strong className="font-semibold">Senior validation:</strong> Bank completing due diligence on same asset
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light">
                    <strong className="font-semibold">Demand floor:</strong> 280+ token holders with stay rights = baseline occupancy
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light">
                    <strong className="font-semibold">Operating history:</strong> Break-even achieved pre-construction
                  </li>
                  <li className="text-sm text-gray-700 leading-relaxed font-light">
                    <strong className="font-semibold">Multiple repayment paths:</strong> Cash flow, token conversion, refinancing
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Token System — De-Risking Mechanism
              </Heading>
              
              <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                How Token Sales Strengthen Your Position
              </Heading>

              <div className="space-y-4 mb-8">
                <div>
                  <strong className="font-semibold text-gray-900">What is $TDF?</strong>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed font-light">
                    A utility token providing holders with: access to stays at TDF, governance participation rights, and discounts on services and events.
                  </p>
                </div>

                <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                  <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                    Why It Matters for Debt Investors
                  </Heading>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-semibold text-gray-900">2025 Token Sales</td>
                          <td className="py-3 px-4 text-gray-700 font-light">€120,000</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 font-semibold text-gray-900">Converted to Equity</td>
                          <td className="py-3 px-4 text-gray-700 font-light">€104,000+ (share capital increase in Enseada Sonhadora S.A.)</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold text-gray-900">2026 Target</td>
                          <td className="py-3 px-4 text-gray-700 font-light">€150,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>

                <div className="space-y-2">
                  <strong className="font-semibold text-gray-900">Mechanism:</strong>
                  <ol className="list-decimal list-inside space-y-2">
                    <li className="text-sm text-gray-700 leading-relaxed font-light">
                      Token sales generate cash to OASA Association
                    </li>
                    <li className="text-sm text-gray-700 leading-relaxed font-light">
                      OASA injects as equity into Enseada Sonhadora S.A.
                    </li>
                    <li className="text-sm text-gray-700 leading-relaxed font-light">
                      Increased equity = stronger balance sheet = reduced default risk
                    </li>
                    <li className="text-sm text-gray-700 leading-relaxed font-light">
                      Token conversions from debt reduce principal owed
                    </li>
                  </ol>
                </div>

                <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg">
                  <strong className="font-semibold text-gray-900">Your Conversion Option:</strong>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed font-light">
                    At any point, convert your debt + accrued interest to $TDF tokens at a <strong className="font-semibold">5% bonus</strong> (e.g., €50K debt → €52.5K worth of tokens).
                  </p>
                  <p className="text-xs text-gray-600 mt-2 font-light italic">
                    Current token price: €256 (bonding curve pricing)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Risk Mitigation
              </Heading>
              
              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-xl font-semibold mb-6 text-gray-900">
                  Why This Debt Is Secured
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Risk</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Mitigation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Construction Risk</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Plans approved; experienced local contractors; €310K contingency</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Financing Risk</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Bank loan in final approval; grant pending; not dependent on single source</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Demand Risk</td>
                        <td className="py-3 px-4 text-gray-700 font-light">280+ token holders with stay rights; 4,867 nights booked in 2025; proven occupancy</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Operational Risk</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Break-even achieved; experienced team; 4 years operating history</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Key Person Risk</td>
                        <td className="py-3 px-4 text-gray-700 font-light">6-person core team; 60+ active community members; documented systems</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-gray-900">Repayment Risk</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Multiple paths: cash flow, token conversion, refinancing; conservative projections</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg">
                <strong className="font-semibold text-gray-900">Institutional Validation:</strong>
                <ul className="list-none mt-2 space-y-2">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">
                      Portuguese bank completing due diligence for €700K senior mortgage
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">
                      EU grant application accepted for review (Transição Justa, up to €600K)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed font-light">
                      140 press articles in 2025; 32K website visitors
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Team
              </Heading>
              
              <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                Who&apos;s Delivering This
              </Heading>

              <div className="space-y-6">
                <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                  <Heading level={4} className="text-lg font-semibold mb-2 text-gray-900">
                    SAMUEL DELESQUE — Founder & Project Lead
                  </Heading>
                  <p className="text-sm text-gray-700 leading-relaxed font-light">
                    Tech veteran (ex-VMware, Dailymotion). 5+ years developing TDF and OASA protocol. Real estate development and systems architecture.
                  </p>
                </Card>

                <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                  <Heading level={4} className="text-lg font-semibold mb-2 text-gray-900">
                    LUNA MANGAN — Community & Space
                  </Heading>
                  <p className="text-sm text-gray-700 leading-relaxed font-light">
                    Interior designer; community building specialist. Consent and governance protocols. 3+ years at TDF.
                  </p>
                </Card>

                <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                  <Heading level={4} className="text-lg font-semibold mb-2 text-gray-900">
                    TIAS & JULIA — Construction Leads
                  </Heading>
                  <p className="text-sm text-gray-700 leading-relaxed font-light">
                    Professional carpenters and builders. Delivered: water temple, mushroom farm, bio-pool, café infrastructure. Training and managing volunteer build teams.
                  </p>
                </Card>

                <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                  <Heading level={4} className="text-lg font-semibold mb-2 text-gray-900">
                    PETER — Finance & Grants
                  </Heading>
                  <p className="text-sm text-gray-700 leading-relaxed font-light">
                    30 years experience at Tamera ecovillage. EU funding, municipality relations, accounting. Joined 2025.
                  </p>
                </Card>

                <Card className="p-6 border border-gray-300 rounded-lg bg-white">
                  <Heading level={4} className="text-lg font-semibold mb-2 text-gray-900">
                    KINGA — Land & Food Systems
                  </Heading>
                  <p className="text-sm text-gray-700 leading-relaxed font-light">
                    Market garden and livestock management. Café Ovo co-founder. Stewardship program graduate.
                  </p>
                </Card>

                <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg">
                  <strong className="font-semibold text-gray-900">Post-Construction Hires (2026–2027):</strong>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed font-light">
                    Hospitality Lead, Head Chef, 3 kitchen/service staff
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Legal Structure
              </Heading>
              
              <div className="space-y-4 mb-8">
                <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm">
                  <div className="text-gray-700">OASA Association (Non-Profit, Zug, Switzerland)</div>
                  <div className="text-gray-700 ml-4">│</div>
                  <div className="text-gray-700 ml-4">│ holds equity in</div>
                  <div className="text-gray-700 ml-4">↓</div>
                  <div className="text-gray-700 ml-4">Enseada Sonhadora S.A. (SPV, Portugal)</div>
                  <div className="text-gray-700 ml-4">│</div>
                  <div className="text-gray-700 ml-4">│ owns</div>
                  <div className="text-gray-700 ml-4">↓</div>
                  <div className="text-gray-700 ml-4">Land + Buildings + Improvements</div>
                  <div className="text-gray-700 ml-4">│</div>
                  <div className="text-gray-700 ml-4">│ secures</div>
                  <div className="text-gray-700 ml-4">↓</div>
                  <div className="text-gray-700 ml-4">Private Debt (Your Investment)</div>
                </div>
              </div>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                  Key Entities
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Entity</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">OASA Association</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Non-profit (Zug, Switzerland); holds equity; receives token sale proceeds; governs protocol</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-semibold text-gray-900">Enseada Sonhadora S.A.</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Portuguese SPV; owns real estate; holds licenses; receives equity injections</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold text-gray-900">TDF (Brand)</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Operating identity; hospitality and community programming</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg">
                <strong className="font-semibold text-gray-900">Your Security:</strong>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed font-light">
                  Formal pledge agreement over shares in Enseada Sonhadora S.A. In a default scenario, debt holders have claim on SPV equity (and thus underlying assets).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Parallel Tracks
              </Heading>
              
              <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                Other Activity (Not Part of This Raise)
              </Heading>

              <div className="space-y-6 mb-8">
                <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                  <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                    Co-Housing Development
                  </Heading>
                  <ul className="list-none space-y-2">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        10 Earthpods + 13 Townhouses planned on adjacent land
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Funded separately by co-housing deposits (€500K committed)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Adds €57K/year utility fee revenue when complete
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Increases restaurant and café utilization
                      </span>
                    </li>
                  </ul>
                </Card>

                <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                  <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                    OASA Network Expansion
                  </Heading>
                  <ul className="list-none space-y-2">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        TDF = proof of concept for replicable regenerative village model
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Closer platform (community management software) being adopted by other projects
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Network effects benefit TDF through shared learnings and member flow
                      </span>
                    </li>
                  </ul>
                </Card>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed font-light italic">
                These tracks run independently and are excluded from this investment&apos;s financial projections.
              </p>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Timeline & Milestones
              </Heading>
              
              <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                <Heading level={3} className="text-lg font-semibold mb-4 text-gray-900">
                  Path to Stabilized Operations
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Milestone</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">Q1 2026</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Private debt raise open</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">April 2026</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Bank loan final approval</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">April 2026</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Grant decision (Transição Justa)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">May 2026</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Private debt close (target)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">May 2026</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Land purchase completion</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">June 2026</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Construction begins</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">Q4 2026</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Construction substantially complete</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">Q1 2027</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Hospitality soft launch</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">H2 2027</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Full commercial operations</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-gray-900 font-semibold">2028</td>
                        <td className="py-3 px-4 text-gray-700 font-light">First full operating year; €650K revenue; positive cash flow</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-900 font-semibold">2029–2030</td>
                        <td className="py-3 px-4 text-gray-700 font-light">Private debt repayment / conversion</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Investor Benefits
              </Heading>
              
              <div className="space-y-6">
                <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                  <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                    Financial Returns
                  </Heading>
                  <ul className="list-none space-y-3">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        5% annual interest (accrued, paid at maturity)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Security: Formal pledge over SPV shares
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Conversion option: 5% bonus if converting to tokens
                      </span>
                    </li>
                  </ul>
                </Card>

                <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                  <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                    Access & Community
                  </Heading>
                  <ul className="list-none space-y-3">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        <strong className="font-semibold">Annual Investor Weekend at TDF</strong> — Join us in Alentejo for a weekend gathering with the community, site tour, and project updates
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Priority information on co-housing opportunities
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Direct relationship with founding team
                      </span>
                    </li>
                  </ul>
                </Card>

                <Card className="p-8 border border-gray-300 rounded-lg bg-white">
                  <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                    Impact
                  </Heading>
                  <ul className="list-none space-y-3">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Fund regenerative land development in Europe
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Support alternative ownership and governance models
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full mt-2.5 mr-4 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 leading-relaxed font-light">
                        Contribute to rural revitalization in Portugal
                      </span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <Heading level={2} className="text-3xl md:text-4xl mb-8 text-gray-900 font-normal">
                Contact & Next Steps
              </Heading>
              
              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                  Join Us
                </Heading>
                <div className="space-y-4">
                  <div>
                    <strong className="font-semibold text-gray-900">Samuel Delesque</strong>
                    <p className="text-sm text-gray-700 font-light">Founder, Traditional Dream Factory</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700 font-light">
                    <div>📧 sam@oasa.co</div>
                    <div>🌐 traditionaldreamfactory.com</div>
                    <div>📍 Abela, Santiago do Cacém, Portugal</div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border border-gray-300 rounded-lg bg-white mb-8">
                <Heading level={3} className="text-xl font-semibold mb-4 text-gray-900">
                  Next Steps
                </Heading>
                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700 font-light">
                  <li><strong className="font-semibold text-gray-900">Introductory Call</strong> — Discuss the opportunity and answer questions</li>
                  <li><strong className="font-semibold text-gray-900">Documentation</strong> — Receive loan agreement and pledge documentation</li>
                  <li><strong className="font-semibold text-gray-900">Site Visit</strong> — Optional visit to TDF (we&apos;ll host you)</li>
                  <li><strong className="font-semibold text-gray-900">Due Diligence</strong> — Financial model, legal documents, references available</li>
                  <li><strong className="font-semibold text-gray-900">Commitment</strong> — Sign loan agreement and transfer funds</li>
                  <li><strong className="font-semibold text-gray-900">Close</strong> — Target May 2026</li>
                </ol>
              </Card>

              <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong className="font-semibold text-gray-900">Minimum Investment:</strong>
                    <div className="text-gray-700 font-light">€50,000</div>
                  </div>
                  <div>
                    <strong className="font-semibold text-gray-900">Target Raise:</strong>
                    <div className="text-gray-700 font-light">€450,000</div>
                  </div>
                  <div>
                    <strong className="font-semibold text-gray-900">Target Close:</strong>
                    <div className="text-gray-700 font-light">May 2026</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs text-gray-600 text-center font-light italic">
                This memorandum is for informational purposes only and does not constitute an offer to sell or solicitation of an offer to buy any securities. Investment involves risk including potential loss of principal.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

PitchPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default PitchPage;
