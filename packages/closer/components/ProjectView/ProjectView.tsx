import Image from 'next/image';
import Link from 'next/link';

import { FC, useState, useEffect } from 'react';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { Project } from '../../types';
import { User } from '../../contexts/auth/types';
import api, { cdn } from '../../utils/api';
import { CloserCurrencies } from '../../types/currency';
import { priceFormat } from '../../utils/helpers';
import EventDescription from '../EventDescription';
import EventPhoto from '../EventPhoto';
import Tag from '../Tag';
import UploadPhoto from '../UploadPhoto';
import { Button, LinkButton } from '../ui';
import Heading from '../ui/Heading';
import Input from '../ui/Input';
import Spinner from '../ui/Spinner';

interface Props {
  project: Project;
  timeFrame?: string;
}

const ProjectView: FC<Props> = ({ project, timeFrame }) => {
  const t = useTranslations();

  const {
    name,
    description,
    photo: projectPhoto,
    start: startDate,
    end: endDate,
    documentUrl,
    budget,
    reward,
    estimate,
    skills,
    manager,
    _id,
  } = project || {};

  const { user, isAuthenticated } = useAuth();
  const [photo, setPhoto] = useState(project && projectPhoto);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [rewardAmount, setRewardAmount] = useState<string>('');
  const [rewardCurrency, setRewardCurrency] = useState<CloserCurrencies>(CloserCurrencies.TDF);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const hasStewardRole = user?.roles?.includes('steward');
  
  // Fetch all users on component mount
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/user');
        if (response?.data?.results) {
          setUsers(response.data.results);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllUsers();
  }, []);
  
  // Search users when searchTerm changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      
      try {
        setIsSearching(true);
        const response = await api.get(`/user?search=${searchTerm}`);
        if (response?.data?.results) {
          setSearchResults(response.data.results);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);
  
  const handleSelectUser = async (user: User) => {
    if (!project._id) return;
    
    try {
      setIsLoading(true);
      const updatedParticipants = [...(project.participants || [])];
      
      if (!updatedParticipants.some(p => p._id === user._id)) {
        updatedParticipants.push(user);
        
        await api.patch(`/project/${project._id}`, {
          participants: updatedParticipants.map(p => p._id)
        });
        
        // Update the local project state
        project.participants = updatedParticipants;
      }
      
      // Clear search
      setSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding participant:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAllocateReward = async () => {
    if (!selectedUser || !rewardAmount || !project._id) return;
    
    try {
      setIsLoading(true);
      const updatedAllocatedRewards = { ...(project.allocatedRewards || {}) };
      updatedAllocatedRewards[selectedUser] = {
        cur: rewardCurrency,
        val: parseFloat(rewardAmount)
      };
      
      await api.patch(`/project/${project._id}`, {
        allocatedRewards: updatedAllocatedRewards
      });
      
      // Update the local project state
      project.allocatedRewards = updatedAllocatedRewards;
      setSelectedUser('');
      setRewardAmount('');
    } catch (error) {
      console.error('Error allocating reward:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateStatus = async (status: 'open' | 'in-progress' | 'done') => {
    if (!project._id) return;
    
    try {
      setIsLoading(true);
      await api.patch(`/project/${project._id}`, {
        status
      });
      
      // Update the local project state
      project.status = status;
    } catch (error) {
      console.error('Error updating project status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!project) {
    return null;
  }
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const duration = end.diff(start, 'hour', true);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMMM Do' : 'MMMM Do';

  return (
    <div className="w-full flex items-center flex-col gap-4">
      <section className=" w-full flex justify-center max-w-4xl">
        <div className="w-full relative">
          <EventPhoto
            event={null}
            user={user}
            photo={photo}
            cdn={cdn}
            isAuthenticated={isAuthenticated}
            setPhoto={setPhoto}
          />

          {hasStewardRole && (
            <div className="absolute right-0 bottom-0 p-8 flex flex-col gap-4">
              <LinkButton
                size="small"
                href={project.slug && `/projects/${project.slug}/edit`}
              >
                {t('button_edit_project')}
              </LinkButton>

              <UploadPhoto
                model="project"
                id={project._id}
                onSave={(id) => setPhoto(id[0])}
                label={photo ? 'Change photo' : 'Add photo'}
              />
            </div>
          )}
        </div>
      </section>

      <section className=" w-full flex justify-center">
        <div className="max-w-4xl w-full ">
          <div className="w-full py-2">
            <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div className="flex gap-1 items-center min-w-[120px]">
                <Image
                  alt="calendar icon"
                  src="/images/icons/calendar-icon.svg"
                  width={20}
                  height={20}
                />
                <label className="text-sm uppercase font-bold flex gap-1">
                  {timeFrame ?? (
                    <>
                      {start && dayjs(start).format(dateFormat)}
                      {end &&
                        Number(duration) > 24 &&
                        ` - ${dayjs(end).format(dateFormat)}`}
                      {end &&
                        Number(duration) <= 24 &&
                        ` - ${dayjs(end).format('HH:mm')}`}{' '}
                      {end && end.isBefore(dayjs()) && (
                        <p className="text-disabled">
                          {t('project_opportunity_ended')}
                        </p>
                      )}
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className=" w-full flex justify-center min-h-[400px]">
        <div className="max-w-4xl w-full">
          <div className="flex flex-col sm:flex-row">
            <div className="flex items-start justify-between gap-6 w-full ">
              <div className="flex flex-col gap-10 w-full overflow-hidden">
                <div className=" w-full flex flex-col sm:flex-row justify-between gap-4 items-center pt-4">
                  <Heading level={1} className="md:text-4xl  font-bold">
                    {name}
                  </Heading>
                  <div className=" w-full sm:w-[250px]">
                    <LinkButton href={`/projects/apply?projectId=${_id}`}>
                      {t('apply_submit_button')}
                    </LinkButton>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2 text-md">
                    <div className="flex gap-2 flex-wrap pb-2">
                      {skills &&
                        skills.map((skill) => (
                          <Tag key={skill} size="small" color="primary">
                            {skill}
                          </Tag>
                        ))}
                    </div>
                    <p>
                      {t('projects_reward')} {priceFormat(reward)}
                    </p>
                    <p>
                      {t('projects_budget')} {priceFormat(budget)}
                    </p>
                    <p>
                      {t('projects_estimate')} {estimate}
                    </p>
                    <p>
                      {t('projects_managed_by')}{' '}
                      <Link href={`/members/${manager?.slug}`}>
                        {manager?.screenname}
                      </Link>
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <LinkButton
                      size="small"
                      className="w-fit"
                      variant="secondary"
                      href={documentUrl}
                      target="_blank"
                    >
                      {t('projects_go_to_document')}
                    </LinkButton>
                  </div>
                </div>
                
                {hasStewardRole && (
                  <div className="flex flex-col gap-6 mt-6 p-4 border border-gray-200 rounded-md">
                    <Heading level={3}>{t('project_management')}</Heading>
                    
                    <div className="flex flex-col gap-2">
                      <Heading level={4}>{t('project_status')}</Heading>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleUpdateStatus('open')}
                          className={`${project.status === 'open' ? 'bg-blue-600' : 'bg-gray-300'} hover:bg-blue-700`}
                          isEnabled={!isLoading}
                        >
                          {t('project_status_open')}
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus('in-progress')}
                          className={`${project.status === 'in-progress' ? 'bg-yellow-600' : 'bg-gray-300'} hover:bg-yellow-700`}
                          isEnabled={!isLoading}
                        >
                          {t('project_status_in_progress')}
                        </Button>
                        <Button 
                          onClick={() => handleUpdateStatus('done')}
                          className={`${project.status === 'done' ? 'bg-green-600' : 'bg-gray-300'} hover:bg-green-700`}
                          isEnabled={!isLoading}
                        >
                          {t('project_status_done')}
                        </Button>
                      </div>
                    </div>
                    
                    <Heading level={4}>{t('project_participants')}</Heading>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder={t('search_users')}
                          value={searchTerm}
                          onChange={(e: any) => setSearchTerm(e.target.value)}
                          className="w-full"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-3">
                            <Spinner />
                          </div>
                        )}
                        {searchResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {searchResults.map(user => (
                              <div 
                                key={user._id} 
                                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleSelectUser(user)}
                              >
                                {user.photo ? (
                                  <Image
                                    src={`${cdn}${user.photo}-profile-sm.jpg`}
                                    alt={user.screenname}
                                    width={30}
                                    height={30}
                                    className="rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <FaUser className="text-gray-500" />
                                  </div>
                                )}
                                <span>{user.screenname}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2">
                        <Heading level={5}>{t('current_participants')}:</Heading>
                        {project.participants && project.participants.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {project.participants.map(participant => (
                              <li key={participant._id}>
                                <Link href={`/members/${participant.slug}`}>
                                  {participant.screenname}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">{t('no_participants_yet')}</p>
                        )}
                      </div>
                    </div>
                    
                    <Heading level={4}>{t('allocate_rewards')}</Heading>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 p-2 border border-gray-300 rounded-md"
                          value={selectedUser}
                          onChange={(e) => setSelectedUser(e.target.value)}
                        >
                          <option value="">{t('select_user')}</option>
                          {project.participants && project.participants.map(user => (
                            <option key={user._id} value={user._id}>
                              {user.screenname}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          placeholder={t('amount')}
                          value={rewardAmount}
                          onChange={(e: any) => setRewardAmount(e.target.value)}
                          className="w-24"
                        />
                        <select
                          className="p-2 border border-gray-300 rounded-md w-24"
                          value={rewardCurrency}
                          onChange={(e) => setRewardCurrency(e.target.value as CloserCurrencies)}
                        >
                          <option value={CloserCurrencies.TDF}>TDF</option>
                          <option value={CloserCurrencies.EUR}>EUR</option>
                        </select>
                        <Button 
                          onClick={handleAllocateReward}
                          isEnabled={!isLoading && Boolean(selectedUser) && Boolean(rewardAmount)}
                        >
                          {t('allocate')}
                        </Button>
                      </div>
                      
                      <div className="mt-2">
                        <Heading level={5}>{t('allocated_rewards')}:</Heading>
                        {project.allocatedRewards && Object.keys(project.allocatedRewards).length > 0 ? (
                          <ul className="list-disc pl-5">
                            {Object.entries(project.allocatedRewards).map(([userId, reward]) => {
                              const user = users.find(u => u._id === userId) || 
                                          project.participants?.find(p => p._id === userId);
                              return (
                                <li key={userId}>
                                  {user ? (
                                    <Link href={`/members/${user.slug}`}>
                                      {user.screenname}
                                    </Link>
                                  ) : (
                                    userId
                                  )}: {reward.val} {reward.cur}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">{t('no_rewards_allocated_yet')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {description && (
                  <section className="max-w-2xl">
                    <EventDescription event={project} isVolunteer={true} />
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectView;
