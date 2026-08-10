import React, { useEffect, useRef } from 'react';

// Import this data from your projects.json file
const projects = [
    {
        'name': 'Traditional Dream Factory',
        'closer': true,
        'description': 'Pioneers of regeneration and prototypers of better living.',
        'tags': [
            'Art',
            'Coliving',
            'Coworking',
            'Eco Village',
            'Education',
            'Event Space',
            'Farming',
            'Web3'
        ],
        'country': 'Portugal',
        'website': 'https://traditionaldreamfactory.com/',
        'coords': [
            38.00315852735004,
            -8.559098061601965
        ]
    },
    {
        'name': 'The Garden',
        'description': 'Living research institute and creative cauldron in northern Portugal near Viana do Castelo. Coliving space for artists, hackers, and world builders exploring new ways of cohabitation, coordination, and creation. Hosts residencies, workshops, and events.',
        'tags': ['Co-living', 'Artist Residency', 'Events', 'Community', 'Creative'],
        'country': 'Portugal',
        'website': 'https://thegarden.pt/',
        'coords': [41.7, -8.8]
    },
    {
        'name': 'Udyāna Sanctuary',
        'description': 'Sanctuary space in Braga, Portugal.',
        'tags': ['Sanctuary', 'Community'],
        'country': 'Portugal',
        'website': '',
        'coords': [41.55, -8.42]
    },
    {
        'name': 'Freedom Ville',
        'description': 'Eco resort and boutique hotel in restored abandoned village of Malhadil, Vale da Certa. 14 hectares with 17 unique accommodations including yurts, tiny houses, apartments. Hosts retreats, artist residencies, and community events.',
        'tags': ['Eco Village', 'Eco Resort', 'Artist Residency', 'Retreats', 'Community'],
        'country': 'Portugal',
        'website': 'https://www.freedomville.pt/',
        'coords': [39.87, -7.49]
    },
    {
        'name': 'JuicyLand',
        'description': 'Community space in central Portugal.',
        'tags': ['Community'],
        'country': 'Portugal',
        'website': '',
        'coords': [40.217, -7.937]
    },
    {
        'name': 'SilveiraTech',
        'description': 'Regeneration village in Serra da Lousã revitalizing two abandoned mountain villages and 230 hectares of forest. Global community hub bridging innovation and regeneration with focus on transformative education, disruptive tech, and ecological restoration.',
        'tags': ['Eco Village', 'Regenerative', 'Tech Hub', 'Community', 'Permaculture', 'Education'],
        'country': 'Portugal',
        'website': 'https://www.silveiratech.pt/',
        'coords': [40.094, -8.197]
    },
    {
        'name': 'Future Thinkers',
        'description': 'A vision for a regenerative living lab and education center.',
        'tags': [
            'Coliving',
            'Coworking',
            'Eco Village',
            'Education',
            'Farming',
            'Maker Space',
            'Web3'
        ],
        'country': 'Canada',
        'website': 'https://futurethinkers.org/',
        'coords': [
            52.37939610539903,
            -120.10482691195828
        ]
    },
    {
        'name': 'Nuanu',
        'description': 'A regenerative village reimagining community living.',
        'tags': [
            'Coliving',
            'Eco Village',
            'Education'
        ],
        'country': 'Portugal',
        'website': 'https://www.nuanu.com/',
        'coords': [
            37.5,
            -8.5
        ]
    },
    {
        'name': 'Eterna',
        'description': 'Building regenerative communities for the future.',
        'tags': [
            'Coliving',
            'Eco Village',
            'Education'
        ],
        'country': 'Portugal',
        'website': 'https://www.eterna.earth/',
        'coords': [
            37.4,
            -8.6
        ]
    },
    {
        'name': 'Next Gen Village',
        'description': 'A next generation intentional community.',
        'tags': [
            'Coliving',
            'Eco Village',
            'Education'
        ],
        'country': 'USA',
        'website': 'https://nextgenvillage.com/',
        'coords': [
            38.0,
            -122.0
        ]
    },
    {
        'name': 'Etherlaken',
        'description': 'Regenerative Living Lab being developed on former Mystery Park/Jungfrau Park site in Bernese Oberland, Interlaken. Led by Jürgen Wowra, Mihai Alisie (Ethereum co-founder), and Ralph Horat. Transforming 100,000+ sqm into experimental campus for 8,000+ people hosting startups, researchers, artists testing future systems in housing, food, energy, mobility, and governance.',
        'tags': ['Regenerative', 'Innovation', 'Living Lab', 'Events', 'Tech', 'Community', 'Shared Ownership'],
        'country': 'Switzerland',
        'website': '',
        'coords': [46.686, 7.867]
    },
    {
        'name': 'Brave Earth',
        'description': 'At Brave Earth we are in an inquiry about how to adapt and create more resiliency.',
        'tags': [
            'Eco Village',
            'Resort'
        ],
        'country': 'Costa Rica',
        'website': 'https://www.braveearth.com/',
        'coords': [
            10.387039654490446,
            -84.59900518946831
        ]
    },
    {
        'name': 'Feytopia',
        'description': 'A collective of artists, entrepreneurs, activists, academics and technologists.',
        'tags': [
            'Art',
            'Coliving',
            'Event Space',
            'Maker Space'
        ],
        'country': 'France',
        'website': 'https://feytopia.com/',
        'coords': [
            48.014520013900935,
            3.330757256138603
        ]
    },
    {
        'name': 'Embassy Network',
        'description': 'Global network of intentional co-living spaces experimenting with governance, culture, and commoning.',
        'tags': ['Co-living', 'Network', 'Governance', 'Community'],
        'country': 'USA',
        'website': 'https://embassynetwork.com/',
        'coords': [37.7749, -122.4194]
    },
    {
        'name': 'L\'arbre qui Pousse',
        'description': 'French intentional community focused on sustainable living and permaculture.',
        'tags': ['Eco Village', 'Permaculture', 'Sustainable'],
        'country': 'France',
        'website': '',
        'coords': [45.0, 2.0]
    }, {
        'name': 'Cohere',
        'description': 'Co-living and community space for regenerative culture.',
        'tags': ['Co-living', 'Regenerative', 'Community'],
        'country': 'USA',
        'website': '',
        'coords': [37.8, -122.4]
    },
    {
        'name': 'Cabin',
        'description': 'Network city connecting creators building neighborhoods in nature.',
        'tags': ['Network', 'Co-living', 'Nature'],
        'country': 'USA',
        'website': 'https://cabin.city/',
        'coords': [40.7, -74.0]
    },
    {
        'name': 'Chateau Chapiteau',
        'description': 'International community and hotel in magic forest near Lagodekhi, Georgia. Founded 2019 by Ivan Mitin (Ziferblat founder) on 12 hectares with tiny houses, A-frames, circus tents, organic farm, and communal living. Family-friendly co-living space.',
        'tags': ['Co-living', 'Community', 'Hotel', 'Eco Village', 'Family-friendly', 'Organic Farm'],
        'country': 'Georgia',
        'website': 'https://www.chateauchapiteau.com/',
        'coords': [41.849, 46.110]
    },
    {
        'name': 'Commons Hub',
        'description': 'Communal guesthouse and events venue in Austrian Alps at historic Hirschwangerhof near Reichenau an der Rax, one hour south of Vienna. Harbor for artists, hackers, and thinkers exploring commons, web3, and regenerative systems. Accommodates 30 overnight guests.',
        'tags': ['Co-working', 'Events', 'Community', 'Commons', 'Web3', 'Regenerative'],
        'country': 'Austria',
        'website': 'https://www.commons-hub.at/',
        'coords': [47.706, 15.810]
    },
    {
        'name': 'Project Ka',
        'description': 'A regenerative community project.',
        'tags': [
            'Coliving',
            'Eco Village'
        ],
        'country': 'Portugal',
        'website': 'https://www.projectka.com/',
        'coords': [
            37.3,
            -8.4
        ]
    },
    {
        'name': 'Emerge Lakefront',
        'description': 'A community focused on personal and collective emergence.',
        'tags': [
            'Coliving',
            'Event Space',
            'Education'
        ],
        'country': 'USA',
        'website': 'https://emergelakefront.org/',
        'coords': [
            43.0,
            -88.0
        ]
    },
    {
        'name': 'Pacha Mama',
        'description': 'An eco-community in Costa Rica focused on holistic healing.',
        'tags': [
            'Coliving',
            'Eco Village',
            'Event Space'
        ],
        'country': 'Costa Rica',
        'website': 'https://www.pachamama.com/',
        'coords': [
            9.7489,
            -83.7534
        ]
    },
    {
        'name': 'Tamera',
        'description': 'Working for a global system change from war to peace.',
        'tags': [
            'Eco Village',
            'Event Space',
            'Farming'
        ],
        'country': 'Portugal',
        'website': 'https://www.tamera.org/',
        'coords': [
            37.719164253904665,
            -8.520731891604433
        ]
    },
    {
        'name': 'Findhorn',
        'description': 'Creating a radically transformed world where humanity embodies the Sacred.',
        'tags': [
            'Eco Village',
            'Farming'
        ],
        'country': 'Scotland',
        'website': 'https://www.findhorn.org/',
        'coords': [
            57.65910431271089,
            -3.607543109005856
        ]
    },
    {
        'name': 'Damanhur',
        'description': 'A Federation of Communities and Eco-society based on ethical and spiritual values.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space'
        ],
        'country': 'Italy',
        'website': 'https://www.damanhur.org/',
        'coords': [
            45.4,
            7.8
        ]
    },
    {
        'name': 'Ängsbacka',
        'description': 'Ängsbacka is more than a venue for courses, festivals and volunteer programs.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space',
            'Farming'
        ],
        'country': 'Sweden',
        'website': 'https://www.angsbacka.com/',
        'coords': [
            59.60160478264089,
            13.700197092607924
        ]
    },
    {
        'name': 'Krishna Village',
        'description': 'Eco Yoga Community in Australia.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space'
        ],
        'country': 'Australia',
        'website': 'https://krishnavillage-retreat.com/',
        'coords': [
            -28.6,
            153.4
        ]
    },
    {
        'name': 'Mindfulness Project',
        'description': 'A mindfulness-based community.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'UK',
        'website': 'https://www.mindfulness-project.org/',
        'coords': [
            51.5,
            -0.1
        ]
    },
    {
        'name': 'Auroville',
        'description': 'An experimental township in India founded with the aim of realizing human unity.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space'
        ],
        'country': 'India',
        'website': 'https://www.auroville.org/',
        'coords': [
            12.0,
            79.8
        ]
    },
    {
        'name': 'Inanitah',
        'description': 'A sustainable community project.',
        'tags': [
            'Coliving',
            'Eco Village'
        ],
        'country': 'Mexico',
        'website': 'https://www.inanitah.com/',
        'coords': [
            20.0,
            -87.0
        ]
    },
    {
        'name': 'Tribal Village',
        'description': 'A community focused on tribal wisdom and sustainable living.',
        'tags': [
            'Coliving',
            'Eco Village',
            'Education'
        ],
        'country': 'USA',
        'website': 'https://tribalvillage.org/',
        'coords': [
            37.0,
            -95.0
        ]
    },
    {
        'name': 'Source Temple Sanctuary',
        'description': 'A sanctuary for spiritual and community development.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://charleseisenstein.org/',
        'coords': [
            37.5,
            -122.5
        ]
    },
    {
        'name': 'Tierramor',
        'description': 'A permaculture education center in Mexico.',
        'tags': [
            'Eco Village',
            'Education',
            'Farming'
        ],
        'country': 'Mexico',
        'website': 'https://tierramor.co/',
        'coords': [
            19.7,
            -101.2
        ]
    },
    {
        'name': 'Philia Center',
        'description': 'Teal Swan\'s community and healing center.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://philiacenter.com/',
        'coords': [
            40.0,
            -111.0
        ]
    },
    {
        'name': 'Yoga Farm',
        'description': 'A yoga and sustainable living community in Costa Rica.',
        'tags': [
            'Eco Village',
            'Education',
            'Farming'
        ],
        'country': 'Costa Rica',
        'website': 'https://www.yogafarmcostarica.org/',
        'coords': [
            10.0,
            -85.0
        ]
    },
    {
        'name': 'Awakeland',
        'description': 'A conscious community in Portugal.',
        'tags': [
            'Coliving',
            'Eco Village',
            'Event Space'
        ],
        'country': 'Portugal',
        'website': 'https://www.awakeland.pt/',
        'coords': [
            37.2,
            -8.7
        ]
    },
    {
        'name': 'Temple of the Earth',
        'description': 'A temple and community space.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'Portugal',
        'website': 'https://templeoftheearth.org/',
        'coords': [
            37.1,
            -8.6
        ]
    },
    {
        'name': 'Nikkilä Temple',
        'description': 'A temple and spiritual community.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'Finland',
        'website': 'https://www.nikkilatemple.org/',
        'coords': [
            60.4,
            25.6
        ]
    },
    {
        'name': 'Monastic Academy',
        'description': 'A residential contemplative community.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://monasticacademy.com/',
        'coords': [
            44.0,
            -72.0
        ]
    },
    {
        'name': 'Hridaya Yoga',
        'description': 'A spiritual retreat center in Mexico.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'Mexico',
        'website': 'https://www.hridayayoga.com/',
        'coords': [
            17.0,
            -96.7
        ]
    },
    {
        'name': 'Plum Village',
        'description': 'Thich Nhat Hanh\'s mindfulness practice center.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'France',
        'website': 'https://www.plumvillage.org/',
        'coords': [
            44.8,
            0.0
        ]
    },
    {
        'name': 'Tierra Iris',
        'description': 'Eco-village focused on permaculture and sustainable living.',
        'tags': ['Eco Village', 'Permaculture', 'Sustainable'],
        'country': 'Spain',
        'website': '',
        'coords': [40.0, -4.0]
    },
    {
        'name': 'Amagi Village',
        'description': 'Family-friendly eco-village in development on Koh Phangan, Thailand. Invite-only creative village for entrepreneurs, artists, and creators blending technology, nature, and wellness.',
        'tags': ['Eco Village', 'Co-living', 'Entrepreneurship', 'Wellness', 'Creative'],
        'country': 'Thailand',
        'website': 'https://amagi.life/',
        'coords': [9.758, 100.029]
    },
    {
        'name': 'Playspace Rio',
        'description': 'Community and play space in Rio de Janeiro.',
        'tags': ['Community', 'Events', 'Culture'],
        'country': 'Brazil',
        'website': '',
        'coords': [-22.9, -43.2]
    },
    {
        'name': 'Diamante Bridge',
        'description': 'Community bridge project.',
        'tags': ['Community', 'Connection'],
        'country': 'Costa Rica',
        'website': '',
        'coords': [9.0, -83.5]
    },
    {
        'name': 'Frequency Village',
        'description': 'Community focused on high-frequency living.',
        'tags': ['Community', 'Conscious Living'],
        'country': 'Portugal',
        'website': '',
        'coords': [37.863287, -25.846044]
    },
    {
        'name': 'Colours of Love',
        'description': 'Global community and transformational festival founded by Wild Sirenda (DJ duo). 5-day events combining music, art, ceremony, wellness, and dream activation. Held at Baba Beach Club, Phuket with yoga, workshops, electronic music, and conscious celebration.',
        'tags': ['Events', 'Music', 'Wellness', 'Community', 'Transformational', 'Dream Activation'],
        'country': 'Thailand',
        'website': 'https://www.wearecoloursoflove.com/',
        'coords': [8.1, 98.3]
    },
    {
        'name': 'AfrikaBurn',
        'description': 'South African regional Burning Man event.',
        'tags': ['Events', 'Culture', 'Community'],
        'country': 'South Africa',
        'website': 'https://afrikaburn.com/',
        'coords': [-32.4, 20.5]
    },
    {
        'name': 'Alversjö (Borderland)',
        'description': 'Member-driven association in Eksjö, Sweden rooted in burner culture principles. 100-hectare farm with building restoration, agriculture, cultural projects, and monthly work weekends. Historic estate dating to 1500s surrounded by nature reserve.',
        'tags': ['Community', 'Burner Culture', 'Co-creation', 'Nature', 'Events', 'Agriculture'],
        'country': 'Sweden',
        'website': 'https://alversjo.land/',
        'coords': [57.62, 14.93]
    },
    {
        'name': 'Prospera',
        'description': 'Special economic zone in Honduras.',
        'tags': ['Community', 'Innovation', 'Governance'],
        'country': 'Honduras',
        'website': 'https://prospera.hn/',
        'coords': [16.3, -86.5]
    },
    {
        'name': 'Fly Ranch',
        'description': 'Burning Man\'s permanent site and research center in Nevada.',
        'tags': ['Events', 'Research', 'Community'],
        'country': 'USA',
        'website': '',
        'coords': [40.9, -119.3]
    },
    {
        'name': 'Burning Man',
        'description': 'Annual art and community event in Black Rock Desert, Nevada.',
        'tags': ['Events', 'Art', 'Community', 'Culture'],
        'country': 'USA',
        'website': 'https://burningman.org/',
        'coords': [40.8, -119.2]
    },
    {
        'name': 'Gandum Village',
        'description': 'Conscious boutique hotel in Alentejo with regenerative agriculture, rammed earth construction, coworking spaces, and sustainable living practices on 14 hectares.',
        'tags': ['Eco Village', 'Regenerative', 'Sustainable', 'Hotel', 'Co-working'],
        'country': 'Portugal',
        'website': 'https://gandum.pt/',
        'coords': [38.65, -8.21]
    },
    {
        'name': 'Villa Gaia',
        'description': 'Systems change hub in Tuscany mountains where teams live and work together. Launched 4 MVS projects in 10 months through proximity, convergence, and coordinated action.',
        'tags': ['Systems Change', 'Hub', 'Co-living', 'Innovation', 'Community'],
        'country': 'Italy',
        'website': '',
        'coords': [42.88, 11.15]
    },
    {
        'name': 'Hedonia',
        'description': 'Berlin-based art movement and trans-local community with gatherings in Tulum, celebrating ethical hedonism, pleasure liberation, and fighting FGM through immersive events.',
        'tags': ['Art Movement', 'Events', 'Community', 'Activism'],
        'country': 'Mexico',
        'website': 'https://www.hedone.berlin/',
        'coords': [20.21, -87.46]
    },
    {
        'name': 'Spirit Rock',
        'description': 'Meditation and retreat center in California.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.spiritrock.org/',
        'coords': [
            38.0,
            -122.7
        ]
    },
    {
        'name': 'Karme-Choling',
        'description': 'Shambhala meditation center in Vermont.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.karmecholing.org/',
        'coords': [
            43.8,
            -72.5
        ]
    },
    {
        'name': 'Ananda Village',
        'description': 'A spiritual community based on yoga teachings.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.anandavillage.org/',
        'coords': [
            39.3,
            -121.0
        ]
    },
    {
        'name': 'Bhakti Center',
        'description': 'A yoga and spiritual center.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.bhakticenter.org/',
        'coords': [
            40.7,
            -74.0
        ]
    },
    {
        'name': 'The Abode',
        'description': 'A Sufi community and retreat center.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.theabode.org/',
        'coords': [
            42.3,
            -73.8
        ]
    },
    {
        'name': 'Zen Mountain Monastery',
        'description': 'A Zen Buddhist monastery and training center.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.zmm.org/',
        'coords': [
            42.0,
            -74.4
        ]
    },
    {
        'name': 'Yogaville',
        'description': 'An interfaith spiritual community.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.yogaville.org/',
        'coords': [
            37.5,
            -78.9
        ]
    },
    {
        'name': 'Lama Foundation',
        'description': 'A spiritual community and retreat center in the mountains of New Mexico.',
        'tags': [
            'Eco Village',
            'Education'
        ],
        'country': 'USA',
        'website': 'https://www.lamafoundation.org/',
        'coords': [
            36.635976985840024,
            -105.60021034161221
        ]
    },
    {
        'name': 'Gampo Abbey',
        'description': 'A Buddhist monastery in Nova Scotia.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'Canada',
        'website': 'https://www.gampoabbey.org/',
        'coords': [
            46.4,
            -61.4
        ]
    },
    {
        'name': 'Selgars Mill',
        'description': '19th century mill estate in Devon\'s Culm Valley hosting nature conferences, team retreats, SOMOS immersions, weddings, and winter co-living residencies on 8 acres.',
        'tags': ['Retreats', 'Nature', 'Co-living', 'Events', 'Regenerative'],
        'country': 'United Kingdom',
        'website': 'https://www.selgars.org/',
        'coords': [50.899, -3.348]
    },

    {
        'name': 'Zen Community of Oregon',
        'description': 'A Zen Buddhist community.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.zencommunityoregon.com/',
        'coords': [
            45.5,
            -122.7
        ]
    },
    {
        'name': 'Korinji',
        'description': 'Rinzai Zen community in Wisconsin.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://korinji.org/',
        'coords': [
            43.4,
            -88.0
        ]
    },
    {
        'name': 'San Francisco Zen Center',
        'description': 'A Soto Zen Buddhist community.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.sfzc.org/',
        'coords': [
            37.7,
            -122.4
        ]
    },
    {
        'name': 'Dancing Rabbit Ecovillage',
        'description': 'An intentional community committed to ecological sustainability.',
        'tags': [
            'Eco Village',
            'Education',
            'Farming'
        ],
        'country': 'USA',
        'website': 'https://dancingrabbit.org/',
        'coords': [
            40.4,
            -92.3
        ]
    },
    {
        'name': 'Possibility Alliance',
        'description': 'A car-free, off-grid homestead and education center.',
        'tags': [
            'Eco Village',
            'Education',
            'Farming'
        ],
        'country': 'USA',
        'website': 'https://possibilityalliance.org/',
        'coords': [
            40.3,
            -92.4
        ]
    },
    {
        'name': 'Sirius Community',
        'description': 'A non-profit educational center and spiritual community.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.siriuscommunity.org/',
        'coords': [
            42.41965589345587,
            -72.42650614602519
        ]
    },
    {
        'name': 'Earthaven Ecovillage',
        'description': 'An aspiring ecovillage in a mountain forest near Asheville.',
        'tags': [
            'Coliving',
            'Eco Village',
            'Education',
            'Farming'
        ],
        'country': 'USA',
        'website': 'https://earthaven.org/',
        'coords': [
            35.52030080939994,
            -82.20362682883604
        ]
    },
    {
        'name': 'Ecovillage Ithaca',
        'description': 'A sustainable cohousing community in New York.',
        'tags': [
            'Eco Village',
            'Education'
        ],
        'country': 'USA',
        'website': 'https://ecovillageithaca.org/',
        'coords': [
            42.5,
            -76.5
        ]
    },
    {
        'name': 'Twin Oaks',
        'description': 'An income-sharing intentional community.',
        'tags': [
            'Coliving',
            'Eco Village',
            'Farming'
        ],
        'country': 'USA',
        'website': 'https://twinoaks.org/',
        'coords': [
            37.9,
            -78.3
        ]
    },
    {
        'name': 'Occidental Arts & Ecology Center',
        'description': 'An organizer training and permaculture research center.',
        'tags': [
            'Education',
            'Event Space',
            'Farming'
        ],
        'country': 'USA',
        'website': 'https://oaec.org/',
        'coords': [
            38.4,
            -122.9
        ]
    },
    {
        'name': 'Crystal Waters',
        'description': 'Australia\'s first permaculture village.',
        'tags': [
            'Eco Village',
            'Farming'
        ],
        'country': 'Australia',
        'website': 'https://www.crystalwaters.org.au/',
        'coords': [
            -26.7,
            152.7
        ]
    },
    {
        'name': 'Purposeflow',
        'description': 'A conscious community space.',
        'tags': [
            'Coliving',
            'Coworking',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://purposeflow.org/',
        'coords': [
            37.8,
            -122.3
        ]
    },
    {
        'name': 'Tui Community',
        'description': 'An intentional community in Golden Bay, New Zealand.',
        'tags': [
            'Eco Village',
            'Event Space',
            'Farming'
        ],
        'country': 'New Zealand',
        'website': 'https://www.tuitrust.org.nz/',
        'coords': [
            -40.81153448401491,
            172.95760384146763
        ]
    },
    {
        'name': 'Liminal Village',
        'description': 'A community dedicated to alternative lifestyles and sustainable living.',
        'tags': [
            'Coliving',
            'Eco Village',
            'Education',
            'Farming'
        ],
        'country': 'Italy',
        'website': 'https://liminalvillage.com/',
        'coords': [
            42.5273002663103,
            13.078969460849983
        ]
    },
    {
        'name': 'Zunya',
        'description': 'A space to reconnect with yourself, nature, and others.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space',
            'Farming',
            'Resort'
        ],
        'country': 'Costa Rica',
        'website': 'https://zunya.com/',
        'coords': [
            9.60787412813174,
            -85.14182228892565
        ]
    },
    {
        'name': 'Mars College',
        'description': 'A virtual learning community focused on space exploration and technology.',
        'tags': [
            'Education',
            'Web3'
        ],
        'country': 'USA',
        'website': 'https://mars.college/',
        'coords': [
            33.35746500317858,
            -115.7311437807498
        ]
    },
    {
        'name': 'MOOS',
        'closer': true,
        'description': 'A creative space in a former bathtub factory in Berlin.',
        'tags': [
            'Art',
            'Coliving',
            'Coworking',
            'Eco Village',
            'Education',
            'Event Space',
            'Maker Space',
            'Web3'
        ],
        'country': 'Germany',
        'website': 'https://moos.space/',
        'coords': [
            52.48814882856454,
            13.46054530048266
        ]
    },
    {
        'name': 'The Venus Project',
        'description': 'Designing a sustainable civilization through resource-based economy.',
        'tags': [
            'Education',
            'Technology'
        ],
        'country': 'USA',
        'website': 'https://thevenusproject.com/',
        'coords': [
            27.0,
            -80.5
        ]
    },
    {
        'name': 'ReGen Villages',
        'description': 'Regenerative neighborhoods that produce their own food, energy, and water.',
        'tags': [
            'Eco Village',
            'Technology'
        ],
        'country': 'Netherlands',
        'website': 'https://regenvillages.com/',
        'coords': [
            52.0,
            5.0
        ]
    },
    {
        'name': 'Esalen Institute',
        'description': 'A retreat center focused on humanistic alternative education.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.esalen.org/',
        'coords': [
            36.2,
            -121.6
        ]
    },
    {
        'name': 'Garrison Institute',
        'description': 'A retreat center applying contemplative wisdom to today\'s pressing issues.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://garrisoninstitute.org/',
        'coords': [
            41.4,
            -74.0
        ]
    },
    {
        'name': 'Omega Institute',
        'description': 'A learning organization focused on personal and social change.',
        'tags': [
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.eomega.org/',
        'coords': [
            42.0,
            -73.9
        ]
    },
    {
        'name': 'Lost Valley',
        'description': 'A non-profit taking a holistic approach to sustainability education.',
        'tags': [
            'Eco Village',
            'Education',
            'Farming'
        ],
        'country': 'USA',
        'website': 'https://www.lostvalley.org/',
        'coords': [
            43.89161177911071,
            -122.82563390185132
        ]
    },
    {
        'name': 'Lios Labs',
        'closer': true,
        'description': 'A community and collaborative workspace in Warsaw.',
        'tags': [
            'Art',
            'Coliving',
            'Education',
            'Maker Space'
        ],
        'country': 'Poland',
        'website': 'https://lios.io/',
        'coords': [
            52.2297,
            21.0122
        ]
    },
    {
        'name': 'Earthbound',
        'closer': true,
        'description': 'A 30-person ecovillage and rural think-tank in southern Sweden.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space'
        ],
        'country': 'Sweden',
        'website': 'https://earthbound.se/',
        'coords': [
            56.0,
            14.0
        ]
    },
    {
        'name': 'Per Auset',
        'closer': true,
        'description': 'A temple village and land regeneration project on a sacred Nile island.',
        'tags': [
            'Eco Village',
            'Education',
            'Event Space',
            'Resort'
        ],
        'country': 'Egypt',
        'website': 'https://perauset.com/',
        'coords': [
            24.0206849,
            32.8859219
        ]
    },
    {
        'name': 'A Quinta da Large',
        'description': 'A Quinta is an intentional community located in Portugal. We are dedicated to exploring the intersection of art, ecology, and technology.',
        'tags': [
            'Art',
            'Coliving',
            'Coworking',
            'Farming'
        ],
        'country': 'Portugal',
        'website': 'https://www.aquinta.org/',
        'coords': [
            37.66908754911384,
            -8.674301842327376
        ]
    },
    {
        'name': 'Sende',
        'description': 'Mountain houses with offices and gardens where you can stay and work on your project.',
        'tags': [
            'Coliving',
            'Coworking',
            'Eco Village'
        ],
        'country': 'Spain',
        'website': 'https://www.sende.co/',
        'coords': [
            42.003608666410095,
            -8.048602813491833
        ]
    },
    {
        'name': 'Aardehuis',
        'description': 'Aardehuis is a pioneering community that merges the principles of art, ecology, and technology.',
        'tags': [
            'Coliving',
            'Eco Village'
        ],
        'country': 'Netherlands',
        'website': 'https://www.aardehuis.nl/index.php/en/',
        'coords': [
            52.32999352004901,
            6.11257358434057
        ]
    },
    {
        'name': 'Gray Area',
        'description': 'Gray Area is a San Francisco-based nonprofit cultural incubator.',
        'tags': [
            'Art',
            'Coworking',
            'Education',
            'Event Space'
        ],
        'country': 'Bay Area USA',
        'website': 'https://grayarea.org/',
        'coords': [
            37.7549350892146,
            -122.41833103863169
        ]
    },
    {
        'name': 'Arcosanti',
        'description': 'Arcosanti is an innovative community situated in the desert of Arizona, USA.',
        'tags': [
            'Art',
            'Coliving',
            'Coworking',
            'Education',
            'Event Space'
        ],
        'country': 'USA',
        'website': 'https://www.arcosanti.org/',
        'coords': [
            34.342549549718704,
            -112.10110404565829
        ]
    }
];

const CommunityMap = () => {
    const mapRef = useRef(null);
    const leafletMapRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return;

        // Dynamically load Leaflet CSS and JS
        const loadLeaflet = async () => {
            // Load CSS
            if (!document.querySelector('link[href*="leaflet.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
                document.head.appendChild(link);
            }

            // Load JS
            if (!window.L) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
                document.head.appendChild(script);

                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            // Wait for L to be available
            while (!window.L) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            initMap();
        };

        const initMap = () => {
            const L = window.L;

            const map = L.map(mapRef.current, {
                zoomControl: true,
                attributionControl: true,
            }).setView([40, 0], 3);

            leafletMapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
                minZoom: 2,
            }).addTo(map);

            // Add custom styles
            const style = document.createElement('style');
            style.textContent = `
        .leaflet-container {
          z-index: 1 !important;
        }
        
        .leaflet-control-container {
          z-index: 800 !important;
        }
        
        .leaflet-popup-pane {
          z-index: 700 !important;
        }
        
        .leaflet-marker-pane {
          z-index: 600 !important;
        }
        
        .leaflet-popup {
          z-index: 700 !important;
        }
        
        .leaflet-tile {
          filter: saturate(0.8) brightness(1.05);
        }
        
        .custom-marker {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #5290DB;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .custom-marker:hover {
          transform: scale(1.3);
          box-shadow: 0 3px 10px rgba(82, 144, 219, 0.4);
        }
        
        .closer-marker {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #5290DB;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(82, 144, 219, 0.3);
          position: relative;
          animation: pulse 2s infinite;
        }
        
        .closer-marker:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 14px rgba(82, 144, 219, 0.5);
        }
        
        .closer-marker::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 3px 10px rgba(82, 144, 219, 0.3), 0 0 0 0 rgba(82, 144, 219, 0.2);
          }
          50% {
            box-shadow: 0 3px 10px rgba(82, 144, 219, 0.3), 0 0 0 10px rgba(82, 144, 219, 0);
          }
        }
        
        .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          padding: 0;
          margin-top: -8px;
        }
        
        .leaflet-popup-tip {
          background: white;
        }
        
        .popup-content {
          max-width: 300px;
          padding: 16px;
        }
        
        .leaflet-popup-close-button {
          background: black !important;
          color: white !important;
          border-radius: 50% !important;
          width: 24px !important;
          height: 24px !important;
          font-size: 16px !important;
          font-weight: bold !important;
          line-height: 1 !important;
          text-align: center !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          top: 8px !important;
          right: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
          transition: all 0.2s ease !important;
        }
        
        .leaflet-popup-close-button:hover {
          background: #2a2a2a !important;
          transform: scale(1.1) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        
        .popup-content h3 {
          margin: 0 0 3px 0;
          color: #1a1a1a;
          font-size: 16px;
          font-weight: 600;
        }
        
        .closer-badge {
          display: inline-block;
          background: black;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }
        
        .popup-content p {
          margin: 0 0 8px 0;
          font-size: 13px;
          line-height: 1.4;
          color: #404040;
        }
        
        .popup-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 8px;
        }
        
        .popup-tag {
          background: #f0f0f0;
          color: #404040;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
        }
        
        .popup-link {
          display: inline-block;
          background: black;
          color: white;
          padding: 8px 14px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 12px;
          margin-top: 4px;
          transition: background 0.3s;
          font-weight: 500;
        }
        
        .popup-link:hover {
          background: #2a2a2a;
        }
        
        .popup-country {
          font-weight: 500;
          color: #666;
          font-size: 13px;
          margin-bottom: 8px;
        }
        
        .leaflet-control-zoom a {
          background: white;
          color: black;
          border: 1px solid #e5e5e7;
        }
        
        .leaflet-control-zoom a:hover {
          background: #f5f5f7;
        }
      `;
            document.head.appendChild(style);

            // Add markers
            projects.forEach((project) => {

                const markerDiv = L.divIcon({
                    className: project.closer ? 'closer-marker' : 'custom-marker',
                    html: '',
                    iconSize: project.closer ? [20, 20] : [12, 12],
                    iconAnchor: project.closer ? [10, 10] : [6, 6],
                });

                const marker = L.marker(project.coords, { icon: markerDiv }).addTo(map);

                const tagHtml = project.tags
                    .map((tag) => `<span class="popup-tag">${tag}</span>`)
                    .join('');

                const closerBadge = project.closer
                    ? '<div class="closer-badge">POWERED BY CLOSER</div>'
                    : '';

                const popupContent = `
          <div class="popup-content">
            ${closerBadge}
            <h3>${project.name}</h3>
            <p class="popup-country">📍 ${project.country}</p>
            <p>${project.description}</p>
            ${tagHtml ? `<div class="popup-tags">${tagHtml}</div>` : ''}
            <a href="${project.website}" target="_blank" rel="noopener noreferrer" class="popup-link">Visit Website →</a>
          </div>
        `;

                marker.bindPopup(popupContent, {
                    maxWidth: 340,
                    className: 'custom-popup',
                });
            });
        };

        loadLeaflet();

        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#f5f5f7] relative">
            <div ref={mapRef} className="flex-1 w-full relative" style={{ zIndex: 1 }} />
        </div>
    );
};

export default CommunityMap;